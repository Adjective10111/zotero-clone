import { NextFunction, Request, Response } from 'express';
import * as errorFactory from './errorFactory';

const handleJWTError = () =>
	errorFactory.createError(401, 'Invalid token. Please log in again!');
const handleJWTExpiredError = () =>
	errorFactory.createError(401, 'Your token has expired! Please log in again.');

const handleCastErrorDB = (err: any) =>
	errorFactory.createError(400, `Invalid ${err.path}: ${err.value}.`);

const handleDuplicateFieldsDB = (err: any) => {
	const value = err.message.match(/{([^}]+)}/g)?.at(0);
	return errorFactory.createError(
		400,
		`Duplicate field value: ${value}. Please use another value!`
	);
};
const handleValidationErrorDB = (err: any) => {
	const errors = Object.values(err.errors).map((el: any) => el.message);
	return errorFactory.createError(
		400,
		`Invalid input data. ${errors.join('. ')}`
	);
};

const modifyError = (err: any) => {
	/* database */
	if (err.code === 11000) return handleDuplicateFieldsDB(err);
	if (err.name === 'CastError') return handleCastErrorDB(err);
	if (err.name === 'ValidationError') return handleValidationErrorDB(err);
	/* JWT */
	if (err.name === 'JsonWebTokenError') return handleJWTError();
	if (err.name === 'TokenExpiredError') return handleJWTExpiredError();
	/* unknown */
	return err;
};

const sendError = (err: errorFactory.OperationalError, res: Response) => {
	console.error(`> ${err.name}: ${err.message}\n${err.stack}`);

	if (process.env.NODE_ENV === 'dev')
		return res.status(err.statusCode).json({
			status: err.status,
			name: err.name,
			message: err.message,
			stack: err.stack
		});

	if (process.env.NODE_ENV === 'production') {
		if (err.isOperational)
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message
			});
		return res.status(500).json({
			status: 'error',
			message: 'something went wrong'
		});
	}
};

export default (
	err: Partial<errorFactory.OperationalError>,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';
	sendError(
		modifyError({ ...err, message: err.message, stack: err.stack }),
		res
	);
};
