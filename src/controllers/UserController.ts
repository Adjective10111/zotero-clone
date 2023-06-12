import crypto from 'crypto';
import { NextFunction, Response } from 'express';
import User, { UserDoc } from '../models/User';
import Authenticator from '../utils/Authenticator';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { type IRequest } from '../utils/types';
import LibraryController from './LibraryController';

type IURequest = IRequest<UserDoc>;

interface ILogin extends IURequest {
	body: {
		email: string;
		password: string;
	};
}

interface IResetRequest extends IURequest {
	params: { token: string };
	body: { newPassword: string };
}
interface ITokenRequest extends IURequest {
	passwordResetToken?: string;
	body: {
		email: string;
	};
}

interface IChangeRequest extends IURequest {
	body: {
		currentPassword: string;
		newPassword: string;
	};
}

export default class UserController extends Controller<typeof User> {
	static userCookie = 'zoteroUser';

	bodyKeys = {
		signUp: {
			mandatory: ['name', 'email', 'password'],
			allowed: ['profile', 'role']
		},
		login: { mandatory: ['email', 'password'] },
		patch: { allowed: ['name', 'profile', 'role'] },
		changePassword: { mandatory: ['currentPassword', 'newPassword'] },
		// resetToken: { mandatory: ['email'] },
		// resetPassword: { mandatory: ['newPassword'] },
		deleteAccount: { mandatory: ['currentPassword'] }
	};
	validateBody = {
		signUp: this.preventMaliciousBody(this.bodyKeys.signUp),
		login: this.preventMaliciousBody(this.bodyKeys.login),
		patch: this.preventMaliciousBody(this.bodyKeys.patch),
		// resetToken: this.preventMaliciousBody(this.bodyKeys.resetToken),
		// resetPassword: this.preventMaliciousBody(this.bodyKeys.resetPassword)
		changePassword: this.preventMaliciousBody(this.bodyKeys.changePassword),
		deleteAccount: this.preventMaliciousBody(this.bodyKeys.deleteAccount)
	};
	removeField = {
		password: this.createRemoveFieldsObject('password')
	};

	constructor() {
		super(User);
	}

	static caughtAuthenticate = Authenticator.caughtAuthenticate(
		User,
		UserController.userCookie
	);
	static authenticate = Authenticator.authenticate(
		User,
		UserController.userCookie,
		true
	);

	validateRoleValue(req: IURequest, res: Response, next: NextFunction) {
		if (req.body?.role === 'admin')
			next(createError(403, 'You cannot set your role as admin'));
		else next();
	}

	@wrapAsync
	async login(req: ILogin, res: Response, next: NextFunction) {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).select('+password');
		if (!user || !(await user.checkPassword(password)))
			return next(createError(400, 'incorrect credentials'));
		user.password = undefined;

		const cookieAndOptions = Authenticator.createCustomCookie(
			req,
			user,
			UserController.userCookie
		);

		req.user = user;
		res.cookie(...cookieAndOptions);
		next();
	}
	@wrapAsync
	async logout(req: IURequest, res: Response, next: NextFunction) {
		req.user = (await User.findById(req.user?.id).select(
			'+blackTokens'
		)) as UserDoc;
		Authenticator.logout(true, req, UserController.userCookie);

		res
			.status(204)
			.cookie(UserController.userCookie, 'loggedOut', {
				expires: new Date(Date.now() + 3000),
				httpOnly: true
			})
			.json({
				status: 'success',
				data: null
			});
	}

	@wrapAsync
	async changePassword(req: IChangeRequest, res: Response, next: NextFunction) {
		const { currentPassword, newPassword } = req.body;

		if (!req.user?.checkPassword(currentPassword))
			return next(createError(400, 'incorrect credentials'));
		if (newPassword.length < 8)
			return next(createError(400, 'password length invalid'));

		await req.user.changePassword(newPassword);
		next();
	}

	@wrapAsync
	async deleteAccount(req: IURequest, res: Response, next: NextFunction) {
		const { currentPassword } = req.body;
		if (!req.user?.checkPassword(currentPassword))
			return next(createError(400, 'incorrect credentials'));

		await LibraryController.deleteLibrariesOf(req.user.id);
		await req.user.deleteOne();
		next();
	}

	// @wrapAsync
	// async generateResetToken(
	// 	req: ITokenRequest,
	// 	res: Response,
	// 	next: NextFunction
	// ) {
	// 	const user = await User.findOne({ email: req.body.email });
	// 	if (!user) return next(createError(404, 'no user with this email'));

	// 	req.passwordResetToken = await user.createPasswordResetToken();
	// 	next();
	// }
	// @wrapAsync
	// async resetPassword(req: IResetRequest, res: Response, next: NextFunction) {
	// 	const hashedToken = crypto
	// 		.createHash('sha256')
	// 		.update(req.params.token)
	// 		.digest('hex');
	// 	const { newPassword } = req.body;

	// 	req.user = (await User.findOne({
	// 		passwordResetToken: hashedToken,
	// 		passwordResetExpiration: { $gt: Date.now() }
	// 	})) as UserDoc;
	// 	if (!req.user)
	// 		return next(createError(400, 'token is invalid or has expired'));

	// 	await req.user.changePassword(newPassword);
	// 	next();
	// }

	@wrapAsync
	async terminateSessions(req: IURequest, res: Response, next: NextFunction) {
		await req.user?.terminateSessions();
		res.status(200).json({
			status: 'success',
			data: `sessions before '${Date.now().toLocaleString()}' are terminated`
		});
	}
}
