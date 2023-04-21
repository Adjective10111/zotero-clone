import { NextFunction, Request, Response } from 'express';
import 'reflect-metadata';

type RequestHandler<R> = (req: any, res: Response, next: NextFunction) => R;

interface RequestHandlerDescriptor extends PropertyDescriptor {
	value?: RequestHandler<Promise<void> | void>;
}

export class OperationalError extends Error {
	isOperational: boolean;
	statusCode: number;
	status: string;

	constructor(message: string, statusCode: number) {
		super(message);

		this.isOperational = true;
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		Error.captureStackTrace(this, this.constructor);
	}
}

export const createError = (
	statusCode: number,
	message: string
): OperationalError => new OperationalError(message, statusCode);

export const wrapAsync = (
	target: any,
	key: string,
	desc: RequestHandlerDescriptor
): void => {
	const method = desc.value as RequestHandler<Promise<void>>;

	desc.value = (req: Request, res: Response, next: NextFunction) => {
		method(req, res, next).catch(next);
	};
};

export const catchAsync =
	(method: RequestHandler<Promise<void>>) =>
	(req: Request, res: Response, next: NextFunction) => {
		method(req, res, next).catch(next);
	};
