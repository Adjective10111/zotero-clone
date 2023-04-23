import { NextFunction, Request, RequestHandler, Response } from 'express';
import 'reflect-metadata';
import { createError } from '../errorFactory';
import { Decorator } from '../types';
import { Use } from './Use';

function preventMaliciousBody(...wantedKeys: string[]): RequestHandler;
function preventMaliciousBody(wantedKeys: string[]): RequestHandler;
function preventMaliciousBody(wantedKeys: any): RequestHandler {
	return function (req: Request, res: Response, next: NextFunction) {
		if (Object.keys(req.body).every(value => wantedKeys.includes(value)))
			next();
		else next(createError(400, 'invalid body'));
	};
}

/**
 * throws an error if body keys are not acceptable
 * it uses the Use decorator and therefore is triggered in the middleware stack
 *
 * @param wantedKeys the acceptable keys
 */
export function BodyValidator(...wantedKeys: string[]): Decorator;
export function BodyValidator(wantedKeys: string[]): Decorator;
export function BodyValidator(wantedKeys: any): Decorator {
	return Use(preventMaliciousBody(wantedKeys as string[]));
}
