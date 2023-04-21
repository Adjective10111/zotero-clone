import crypto from 'crypto';
import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { promisify } from 'util';
import User, { IUser, IUserMethods } from '../models/User';
import Authenticator from '../utils/Authenticator';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { Doc, type IDed, type IRequest } from '../utils/types';

type URequest = IRequest<IUser, IUserMethods>;

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
interface IChangeRequest extends Required<URequest> {
	body: {
		currentPassword?: string;
		newPassword?: string;
	};
}
interface IForgotRequest extends URequest {
	passwordResetToken?: string;
	body: {
		email: string;
	};
}

const verifyJWT: unknown = promisify<string, string>(jwt.verify) as unknown;

export class UserController extends Controller<typeof User> {
	static userCookie = 'zoteroUser';

	static bodyKeys = {
		signUp: ['name', 'email', 'password', 'photo', 'role'],
		resetToken: ['email'],
		changePassword: ['currentPassword', 'newPassword'],
		resetPassword: ['newPassword']
	};

	constructor() {
		super(User);
	}

	caughtAuthenticate = Authenticator.caughtAuthenticate(this.getUser);
	authenticate = Authenticator.authenticate(this.getUser);

	async getUser(req: IRequest) {
		const token = Authenticator.searchForAuthentication(req);
		if (!token) throw createError(401, 'login to continue');

		let decoded: IDed & JwtPayload;
		if (typeof verifyJWT === 'function')
			decoded = await verifyJWT(token, process.env.JWT_SECRET as string);
		else throw createError(400, 'invalid authorization');

		const user = await User.findById(
			decoded.id,
			'-passwordResetToken -passwordResetExpiration'
		);
		if (!user) throw createError(404, 'user does not exist, login');
		if (!user.allowedSession(decoded.iat))
			throw createError(401, 'old session, login again');

		return user;
	}

	validateBodyForSignup = this.preventMaliciousBody(
		...UserController.bodyKeys.signUp
	);
	/**
	 * createOne Operation
	 */
	@wrapAsync
	async signUp(req: URequest, res: Response, next: NextFunction) {
		if (req.body.role && req.body.role === 'admin')
			return next(createError(403, 'can not signup as admin'));
		await this.createOne(req, res, next);
		next();
	}
	/**
	 * login Operation
	 */
	@wrapAsync
	async login(req: ILogin, res: Response, next: NextFunction) {
		const { email, password } = req.body;
		if (!email || !password)
			return next(createError(400, 'provide credentials'));

		const user = await User.findOne({ email }).select('+password');
		if (!user || !(await user.checkPassword(password)))
			return next(createError(400, 'incorrect credentials'));
		// remove password from output
		user.password = undefined;

		const cookieAndOptions = Authenticator.createCustomCookie(
			req,
			user,
			UserController.userCookie
		);

		res.cookie(...cookieAndOptions);
		next();
	}
	/**
	 * logout Operation
	 */
	logout(req: URequest, res: Response, next: NextFunction) {
		res.cookie(UserController.userCookie, 'loggedOut', {
			expires: new Date(Date.now() + 3000),
			httpOnly: true
		});
		next();
	}

	validateBodyForResetPassword = this.preventMaliciousBody(
		...UserController.bodyKeys.resetPassword
	);
	/**
	 * patch Operation
	 */
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
		})) as Doc<IUser, IUserMethods>;
		if (!req.user)
			return next(createError(400, 'token is invalid or has expired'));

		await req.user.changePassword(newPassword);
		next();
	}

	validateBodyForChangePassword = this.preventMaliciousBody(
		...UserController.bodyKeys.changePassword
	);
	/**
	 * patch Operation
	 */
	@wrapAsync
	async changePassword(req: IChangeRequest, res: Response, next: NextFunction) {
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword)
			return next(createError(400, 'provide credentials'));

		if (!req.user.checkPassword(currentPassword))
			return next(createError(400, 'incorrect credentials'));

		await req.user.changePassword(newPassword);
		next();
	}

	validateBodyForForgotPassword = this.preventMaliciousBody(
		...UserController.bodyKeys.resetToken
	);
	@wrapAsync
	async forgotPassword(req: IForgotRequest, res: Response, next: NextFunction) {
		const user = await User.findOne({ email: req.body.email });
		if (!user) return next(createError(404, 'no user with this email'));

		req.passwordResetToken = await user.createPasswordResetToken();
		next();
	}

	@wrapAsync
	async terminateSessions(
		req: Required<URequest>,
		res: Response,
		next: NextFunction
	) {
		await req.user.terminateSessions();
		res.status(200).json({
			status: 'success',
			data: `sessions before '${Date.now().toLocaleString()}' are terminated`
		});
	}
}
