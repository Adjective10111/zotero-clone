import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { catchAsync, createError, wrapAsync } from './errorFactory';
import { genericUser } from './schemaFactory';
import { Cookie, Doc, IRequest } from './types';

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

		const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
			expiresIn: expiration.token
		});

		return [
			cookieName,
			token,
			{
				expires: new Date(
					Date.now() + parseInt(expiration.cookie) * 24 * 3600 * 1000
				),
				httpOnly: true,
				secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
			}
		];
	}

	static searchForAuthentication(req: IRequest, cookieName?: string) {
		let token;
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith('Bearer')
		)
			token = req.headers.authorization.split(' ')[1];
		else if (cookieName && req.cookies[cookieName])
			token = req.cookies[cookieName];

		return token;
	}

	static caughtAuthenticate(
		getUser: (req: IRequest) => Promise<Doc<genericUser>>
	) {
		return async function (req: IRequest, res: Response, next: NextFunction) {
			try {
				const user = await getUser(req);
				req.user = user;
			} catch (err) {}
			next();
		};
	}

	static authenticate(getUser: (req: IRequest) => Promise<Doc<genericUser>>) {
		return catchAsync(async function (
			req: IRequest,
			res: Response,
			next: NextFunction
		) {
			const user = await getUser(req);
			req.user = user;

			next();
		});
	}

	static restrictTo(...roles: string[]) {
		return function (req: IRequest, res: Response, next: NextFunction) {
			if (!req.user || !req.user.role || !roles.includes(req.user.role))
				next(createError(403, 'unauthorized'));
			else next();
		};
	}

	static isAdmin(req: IRequest, res: Response, next: NextFunction) {
		if (req.user && req.user.role && req.user.role === 'admin') {
			req.isAdmin = true;
			return true;
		}
		return false;
	}
}
