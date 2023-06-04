import crypto from 'crypto';
import { NextFunction, Response } from 'express';
import User, { UserDoc } from '../models/User';
import Authenticator from '../utils/Authenticator';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { type IRequest } from '../utils/types';

type URequest = IRequest<UserDoc>;

interface ILogin extends URequest {
	body: {
		email: string;
		password: string;
	};
}

interface IResetRequest extends URequest {
	params: { token: string };
	body: { newPassword: string };
}
interface IChangeRequest extends URequest {
	body: {
		currentPassword: string;
		newPassword: string;
	};
}
interface ITokenRequest extends URequest {
	passwordResetToken?: string;
	body: {
		email: string;
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
		resetToken: { mandatory: ['email'] },
		resetPassword: { mandatory: ['newPassword'] }
	};
	validateBody = {
		signUp: this.preventMaliciousBody(this.bodyKeys.signUp),
		login: this.preventMaliciousBody(this.bodyKeys.login),
		patch: this.preventMaliciousBody(this.bodyKeys.patch),
		resetToken: this.preventMaliciousBody(this.bodyKeys.resetToken),
		changePassword: this.preventMaliciousBody(this.bodyKeys.changePassword),
		resetPassword: this.preventMaliciousBody(this.bodyKeys.resetPassword)
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

	validateRoleValue(req: URequest, res: Response, next: NextFunction) {
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
	async logout(req: URequest, res: Response, next: NextFunction) {
		req.user = (await User.findById(req.user?.id).select(
			'+blackTokens'
		)) as UserDoc;
		Authenticator.logout(true, req, res, UserController.userCookie);
		next();
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
	async generateResetToken(
		req: ITokenRequest,
		res: Response,
		next: NextFunction
	) {
		const user = await User.findOne({ email: req.body.email });
		if (!user) return next(createError(404, 'no user with this email'));

		req.passwordResetToken = await user.createPasswordResetToken();
		next();
	}
	@wrapAsync
	async resetPassword(req: IResetRequest, res: Response, next: NextFunction) {
		const hashedToken = crypto
			.createHash('sha256')
			.update(req.params.token)
			.digest('hex');
		const { newPassword } = req.body;

		req.user = (await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpiration: { $gt: Date.now() }
		})) as UserDoc;
		if (!req.user)
			return next(createError(400, 'token is invalid or has expired'));

		await req.user.changePassword(newPassword);
		next();
	}

	@wrapAsync
	async terminateSessions(req: URequest, res: Response, next: NextFunction) {
		await req.user?.terminateSessions();
		res.status(200).json({
			status: 'success',
			data: `sessions before '${Date.now().toLocaleString()}' are terminated`
		});
	}
}
