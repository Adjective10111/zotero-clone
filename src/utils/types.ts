import { CookieOptions, type NextFunction, type Request } from 'express';
import { Types, type HydratedDocument, type PopulateOptions } from 'mongoose';
import { genericUser } from './schemaFactory';

export type NumericString = `${number}`;

export type Doc<T, TOverrides = {}> = HydratedDocument<T, TOverrides>;

export type CRUD =
	| 'bulkCreate'
	| 'create'
	| 'getAll'
	| 'getOne'
	| 'patch'
	| 'delete'
	| 'login'
	| 'logout';

export type Cookie = [string, string, CookieOptions];

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
	filterGetAllObject?: object;
}

export type CustomRequestHandler<
	Req = Request,
	Res = Response,
	Ret = Promise<void> | void
> = (req: Req, res: Res, next: NextFunction) => Ret;
