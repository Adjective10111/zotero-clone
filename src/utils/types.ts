import {
	type CookieOptions,
	type NextFunction,
	type Request,
	type RequestHandler
} from 'express';
import { Types, type HydratedDocument, type PopulateOptions } from 'mongoose';
import { type genericUser } from './schemaFactory';

export type NumericString = `${number}`;

export type Decorator = (
	target: any,
	key: string,
	desc: PropertyDescriptor
) => void;

export interface RouteHandlerDescriptor extends PropertyDescriptor {
	value?: RequestHandler;
}

export type Doc<T, TOverrides = {}> = HydratedDocument<T, TOverrides>;

export type CRUD =
	| 'bulkCreate'
	| 'create'
	| 'getAll'
	| 'getOne'
	| 'patch'
	| 'delete'
	| 'logout';

export type Cookie = [string, string, CookieOptions];

export interface BodyValidationKeys {
	mandatory?: string[];
	allowed?: string[];
}

export interface IDed {
	id: string | Types.ObjectId;
}

export interface ITimestamped {
	createdAt: Date;
	updatedAt: Date;
}

export interface IRequest<U extends genericUser = genericUser, UOverrides = {}>
	extends Request {
	user?: Doc<U, UOverrides>;
	[key: string]: any;
}

export interface IRemoveFieldsRequest extends IRequest {
	removeFields?: string[];
}

export interface IPopulateRequest extends IRequest {
	populateArray?: PopulateOptions[];
}

export interface IFilterRequest extends IPopulateRequest {
	defaultFilter?: { [key: string]: any };
}

export type CustomRequestHandler<
	Req = Request,
	Res = Response,
	Ret = Promise<void> | void
> = (req: Req, res: Res, next: NextFunction) => Ret;

export type MiddlewareCondition = (req: Request) => boolean;
