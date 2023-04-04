import { NextFunction, Request, RequestHandler, Response } from 'express';
import mongoose, { PopulateOptions } from "mongoose";
import { isEmpty } from './basicFunctions';
import { createError, wrapAsync } from './errorFactory';

class QueryHandler<DocType> {
	static readonly resCtrlKeys: string[] = ['page', 'sort', 'limit', 'fields', 'all'];

	constructor(
		public query: mongoose.Query<DocType[], DocType>,
		public queryString: mongoose.QueryOptions<DocType> & { page?: number }
	) {
	}

	filter(): this {
		let filterQuery: object = Object.keys(this.queryString)
			.filter(key => !QueryHandler.resCtrlKeys.includes(key))
			.reduce((obj, key) => {
				return {
					...obj,
					[key]: this.queryString[key]
				};
			}, {});

		// advanced filtering: Support for operators
		filterQuery = JSON.parse(
			JSON.stringify(filterQuery).replace(
				/\b(gte|gt|lte|lt)\b/g,
				match => `$${match}`
			)
		);

		this.query = this.query.find(filterQuery);

		return this;
	}

	sort(): this {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ');
			this.query.sort(sortBy);
		}

		return this;
	}

	paginate(): this {
		const page: number = (this.queryString.page || 1) - 1;
		const limit: number = this.queryString.limit || 25;
		const skip: number = page * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}

	selectFields(): this {
		let fields = '-__v';
		if (this.queryString.fields)
			fields += ` ${this.queryString.fields.split(',').join(' ')}`;

		this.query = this.query.select(fields);

		return this;
	}

	async exec(): Promise<DocType[]> {
		return this.query.exec();
	}
}

interface IRequest extends Request {
	user: {
		_id: mongoose.ObjectId;
	}
	[key: string]: any;
}

interface ICreateRequest extends IRequest {
	removeFields?: string[];
}

interface IGetRequest extends IRequest {
	populateArray?: mongoose.PopulateOptions[];
}

interface IGetAllRequest extends IGetRequest {
	filterGetAllObject?: object;
}

type CustomRequestHandler<Req=Request, Res=Response, Ret= Promise<void> | void> = (req: Req, res: Res, next: NextFunction) => Ret;

type CRUD = 'bulkCreate' | 'create' | 'getAll' | 'getOne' | 'patch' | 'delete';

export class Controller<DocType extends mongoose.Model<any>> {
	private modelName: string;

	constructor(
		public model: mongoose.Model<any>
	) {
		this.modelName = this.model.modelName.toLowerCase();
	}

	preventMaliciousBody(...wantedKeys: string[]) {
		return function (req: Request, res: Response, next: NextFunction) {
			if (Object.keys(req.body).every(value => wantedKeys.includes(value))) next();
			else next(createError(400, 'invalid body'));
		}
	}

	createRemoveFieldsObject(...fields: string[]) {
		return function(req: ICreateRequest, res: Response, next: NextFunction) {
			req.removeFields = fields;
			
			next();
		}
	}
	
	createPopulateArray(...populateArray: PopulateOptions[]) {
		return function(req: IGetRequest, res: Response, next: NextFunction) {
			req.populateArray = populateArray;

			next();
		}
	}
	
	moveReqKeyToBody(bodyKey: string, ...nestedReqKey: string[]) {
		return function(req: IRequest, res: Response, next: NextFunction) {
			let iterator: any = req;
			nestedReqKey.forEach(key => {
				if (iterator[key]) iterator = iterator[key];
				else
					next(createError(400, `missing item from request: ${nestedReqKey}`));
			});
			req.body[bodyKey] = iterator;

			next();
		}
	}

	static unavailable(req: Request, res: Response, next: NextFunction) {
		next(createError(404, 'Page Not Found'));
	}
	static unauthorized(req: Request, res: Response, next: NextFunction) {
		next(createError(403, 'Unauthorized Access'));
	}
	
	static conditionalMiddleware(middleware: RequestHandler, negated: boolean, ...conditions: CustomRequestHandler<Request, Response, boolean>[]) {
		return function (req: Request, res: Response, next: NextFunction) {
			let result = true;
			conditions.forEach(cond => {
				let evaluated = cond(req, res, next);
				if (negated)
					evaluated = !evaluated;
				if (result) result = result && evaluated;
			});

			if (result) return middleware(req, res, next);
			next();
		}
	}
	
	static authorizeOwnership(...nestedOwnerId: string[]) {
		return function (req: IRequest, res: Response, next: NextFunction) {
			let ownerId: any = req;
			nestedOwnerId.forEach(key => {
				if (ownerId[key]) ownerId = ownerId[key];
				else
					next(
						createError(400, `missing item from request: ${nestedOwnerId}`)
						);
			});
			if (ownerId !== req.user._id)
				next(createError(403, 'not the owner of document'));
			else
				next();
		}
	}

	static isChildRouter(parentParam: string) {
		return function (req: IRequest, res: Response, next: NextFunction): boolean {
			return !!req.params[parentParam];
		}
	}
	
	//#region CRUD operations:
	@wrapAsync
	async createOne(req: ICreateRequest, res: Response, next: NextFunction): Promise<void> {
		const document = await this.model.create(req.body);
		if (req.removeFields) {
			req.removeFields.forEach(field => {
				document[field] = undefined;
			});
		}

		req[this.modelName] = document;
		next();
	}

	@wrapAsync
	async getAll(req: IGetAllRequest, res: Response, next: NextFunction): Promise<void> {
		const filter = req.filterGetAllObject || {};

		let query = this.model.find(filter);
		// populate if needed
		if (req.populateArray) {
			req.populateArray.forEach(populateOptions => {
				query = query.populate(populateOptions);
			});
		}

		const documents = await new QueryHandler<DocType>(query, req.query)
			.filter()
			.sort()
			.paginate()
			.selectFields()
			.exec();

		req[`${this.modelName}s`] = documents;
		next();
	}

	@wrapAsync
	async getOne(req: IGetRequest, res: Response, next: NextFunction): Promise<void> {
		const id = req.params.id;

		let query = this.model.findById(id);
		// populate if needed
		if (req.populateArray) {
			req.populateArray.forEach(populateOptions => {
				query = query.populate(populateOptions);
			});
		}

		const document = await query;
		if (!document)
			return next(createError(404, 'document not found'));

		req[this.modelName] = document;
		next();
	}

	@wrapAsync
	async patchById(req: IRequest, res: Response, next: NextFunction): Promise<void> {
		if (isEmpty(req.body))
			return next(createError(400, 'no useful body was passed'));

		const document = await this.model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		});
		if (!document)
			return next(createError(404, 'document not found'));

		req[this.modelName] = document;
		next();
	}

	@wrapAsync
	async patchDocument(req: IRequest, res: Response, next: NextFunction): Promise<void> {
		if (isEmpty(req.body))
			return next(createError(400, 'no useful body was passed'));

		Object.keys(req.body).forEach(key => {
			req[this.modelName][key] = req.body[key];
		});

		req[this.modelName] = await req[this.modelName].save();
		next();
	}

	@wrapAsync
	async deleteById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const document = await this.model.findByIdAndDelete(req.params.id);
		if (!document)
			return next(createError(404, 'document not found'));

		next();
	}

	@wrapAsync
	async deleteDocument(req: IRequest, res: Response, next: NextFunction): Promise<void> {
		await req[this.modelName].deleteOne();
		next();
	}

	sendCRUDOperation(this: Controller<DocType>, operation: CRUD) {
		return function (this: Controller<DocType>, req: IRequest, res: Response, next: NextFunction) {
			switch (operation) {
				case 'bulkCreate':
					res.status(201).json({
						status: 'success',
						count: req[`${this.modelName}s`].length,
						data: req[`${this.modelName}s`]
					});
					break;
				case 'create':
					res.status(201).json({
						status: 'success',
						data: req[this.modelName]
					});
					break;
				case 'getAll':
					res.status(200).json({
						status: 'success',
						count: req[`${this.modelName}s`].length,
						data: req[`${this.modelName}s`]
					});
					break;
				case 'getOne':
					res.status(200).json({
						status: 'success',
						data: req[this.modelName]
					});
					break;
				case 'patch':
					res.status(200).json({
						status: 'success',
						data: req[this.modelName]
					});
					break;
				case 'delete':
					res.status(204).json({
						status: 'success',
						data: null
					});
					break;
				default:
					res.status(200).json({
						data: null
					});
			}
		}
	}
	//#endregion
}
