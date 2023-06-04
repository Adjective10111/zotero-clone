import { CookieOptions, NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { promisify } from 'util';
import { catchAsync, createError } from './errorFactory';
import { genericUser } from './schemaFactory';
import { Cookie, Doc, IRequest, type IDed } from './types';

type Verifier = (token: string, secret: string) => Promise<IDed & JwtPayload>;
const verifyJWT: unknown = promisify<string, string>(jwt.verify) as unknown;

export default class Authenticator {
	static createCustomCookie(
		req: IRequest,
		user: Doc<genericUser>,
		cookieName: string
	): Cookie {
		const id = user._id;
		const expiration = {
			token:
				user.role === 'admin'
					? process.env.ADMIN_JWT_EXPIRES_IN
					: process.env.JWT_EXPIRES_IN,
			cookie:
				user.role === 'admin'
					? process.env.ADMIN_JWT_COOKIE_EXPIRES_IN
					: process.env.JWT_COOKIE_EXPIRES_IN
		} as { token: string; cookie: string };

		let signOptions = undefined;
		if (expiration.token !== '0') signOptions = { expiresIn: expiration.token };
		const token = jwt.sign(
			{ id },
			process.env.JWT_SECRET as string,
			signOptions
		);

		let resCookieOptions: CookieOptions = {
			httpOnly: true
			// secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
		};
		if (expiration.cookie !== '0')
			resCookieOptions['expires'] = new Date(
				Date.now() + parseInt(expiration.cookie) * 24 * 3600 * 1000
			);
		return [cookieName, token, resCookieOptions];
	}

	static searchForAuthentication(req: IRequest, cookieName?: string) {
		let token;
		if (req.headers.authorization?.startsWith('Bearer'))
			token = req.headers.authorization.split(' ')[1];
		else if (cookieName && req.cookies[cookieName])
			token = req.cookies[cookieName];

		return token;
	}
	static async getUser(
		hasTokenBlacklist: boolean,
		req: IRequest,
		UserModel: Model<genericUser & any>,
		cookieName?: string
	) {
		const token = Authenticator.searchForAuthentication(req, cookieName);
		if (!token) throw createError(401, 'login to continue');

		const decoded = await (verifyJWT as Verifier)(
			token,
			process.env.JWT_SECRET as string
		);

		const user = await UserModel.findById(
			decoded.id,
			'-passwordResetToken -passwordResetExpiration'
		);
		if (!user) throw createError(404, 'user does not exist, login');
		if (user.allowedSession && !user.allowedSession(decoded.iat))
			throw createError(401, 'old session, login again');

		if (hasTokenBlacklist) {
			if (!user.blackTokens) {
				user.blackTokens = [];
				await user.save();
			} else if (user.blackTokens.includes(token))
				throw createError(401, 'invalid session, login again');
		}

		return user;
	}
	static caughtAuthenticate(
		UserModel: Model<genericUser & any>,
		cookieName?: string,
		hasTokenBlacklist: boolean = false
	) {
		return catchAsync(async function (
			req: IRequest,
			res: Response,
			next: NextFunction
		) {
			try {
				const user = await Authenticator.getUser(
					hasTokenBlacklist,
					req,
					UserModel,
					cookieName
				);
				req.user = user;
			} catch (err) {}
			next();
		});
	}
	static authenticate(
		UserModel: Model<genericUser & any>,
		cookieName?: string,
		hasTokenBlacklist: boolean = false
	) {
		return catchAsync(async function (
			req: IRequest,
			res: Response,
			next: NextFunction
		) {
			const user = await Authenticator.getUser(
				hasTokenBlacklist,
				req,
				UserModel,
				cookieName
			);
			req.user = user;

			next();
		});
	}

	static async logout(
		hasTokenBlacklist: boolean,
		req: IRequest,
		res: Response,
		cookieName?: string
	) {
		if (!req.user) throw createError(400, 'no user was logged in');

		if (hasTokenBlacklist) {
			const token = Authenticator.searchForAuthentication(req, cookieName);
			if (!token) throw createError(401, 'login to continue');

			const decoded = await (verifyJWT as Verifier)(
				token,
				process.env.JWT_SECRET as string
			);

			await (
				req.user as typeof req.user & {
					addBlackToken: (
						token: string,
						issuedAt?: number,
						expiration?: number
					) => Promise<void>;
				}
			).addBlackToken(token, decoded.iat, decoded.exp);
		}
		if (cookieName)
			res.cookie(cookieName, 'loggedOut', {
				expires: new Date(Date.now() + 3000),
				httpOnly: true
			});
	}

	static restrictTo(...roles: string[]) {
		return function (req: IRequest, res: Response, next: NextFunction) {
			if (!req.user?.role || !roles.includes(req.user.role))
				next(createError(403, 'unauthorized'));
			else next();
		};
	}

	static isAdmin(req: IRequest, res: Response, next: NextFunction) {
		if (req.user?.role === 'admin') {
			req.isAdmin = true;
			return true;
		}
		return false;
	}
}
