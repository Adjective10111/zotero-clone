import { type NextFunction, type Request } from 'express';
import { Types, type HydratedDocument, type PopulateOptions } from 'mongoose';

export type numericString = `${number}`;

export type Doc<T> = HydratedDocument<T>;

export type CRUD =
	| 'bulkCreate'
	| 'create'
	| 'getAll'
	| 'getOne'
	| 'patch'
	| 'delete';

export interface ITimestamped {
	createdAt: Date;
	updatedAt: Date;
}

export interface IRequest extends Request {
	user?: {
		_id: Types.ObjectId;
	};
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
