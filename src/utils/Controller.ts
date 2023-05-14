import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Model, PopulateOptions, Query, QueryOptions } from 'mongoose';
import { isEmpty } from './basicFunctions';
import { OperationalError, catchAsync, createError } from './errorFactory';
import {
	BodyValidationKeys,
	CRUD,
	IFilterRequest,
	IPopulateRequest,
	IRemoveFieldsRequest,
	IRequest,
	MiddlewareCondition
} from './types';

class QueryHandler<DocType> {
	static readonly resCtrlKeys: string[] = [
		'page',
		'sort',
		'limit',
		'fields',
		'all'
	];

	constructor(
		public query: Query<DocType[], DocType>,
		public queryString: QueryOptions<DocType> & { page?: number }
	) {}

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
		return await this.query.exec();
	}
}

interface ConditionalMiddleware {
	if: MiddlewareCondition[];
	then: RequestHandler[];
	else?: RequestHandler[];
	negated?: boolean;
}

export default abstract class Controller<DocType extends Model<any>> {
	modelName: string;

	constructor(public model: Model<any>) {
		this.modelName = this.model.modelName.toLowerCase();
	}

	debugLog(req: IRequest, res: Response, next: NextFunction) {
		console.log(
			`${Date.now()} - ${req.url} - ParamKeys: ${Object.keys(req.params)} - ${
				req.isChildRouter
			} - BodyKeys: ${Object.keys(req.body)}`
		);
		next();
	}

	/**
	 * prevents the use of keys that are not valid
	 * but doesn't guarantee the use of all the keys
	 *
	 * @param allowed - string[]
	 * @returns middleware
	 */
	preventMaliciousBody(bodyValidationKeys: BodyValidationKeys) {
		let { mandatory = [], allowed = [] } = bodyValidationKeys;

		return function (req: Request, res: Response, next: NextFunction) {
			allowed = allowed.concat(mandatory);
			if (
				mandatory.every(value => req.body[value]) &&
				Object.keys(req.body).every(value => allowed.includes(value))
			)
				next();
			else next(createError(400, 'invalid body'));
		};
	}

	filterByOwnerFactory(ownerKey: string) {
		return function (req: IFilterRequest, res: Response, next: NextFunction) {
			req.defaultFilter = {
				...(req.defaultFilter || {}),
				[ownerKey]: req.user?._id
			};

			next();
		};
	}

	createRemoveFieldsObject(...fields: string[]) {
		return function (
			req: IRemoveFieldsRequest,
			res: Response,
			next: NextFunction
		) {
			req.removeFields = fields;

			next();
		};
	}

	createPopulateArray(...populateArray: PopulateOptions[]) {
		return function (req: IPopulateRequest, res: Response, next: NextFunction) {
			if (!req.populateArray) req.populateArray = [];
			req.populateArray = [...req.populateArray, ...populateArray];

			next();
		};
	}

	removePopulateArray(
		req: IPopulateRequest,
		res: Response,
		next: NextFunction
	) {
		req.populateArray = undefined;
		next();
	}

	moveReqKeyToBody(bodyKey: string, ...nestedReqKey: string[]): RequestHandler {
		return function (req: IRequest, res: Response, next: NextFunction) {
			let iterator: any = req;
			nestedReqKey.forEach(key => {
				if (iterator[key]) iterator = iterator[key];
				else
					next(createError(400, `missing item from request: ${nestedReqKey}`));
			});
			req.body[bodyKey] = iterator;

			next();
		};
	}
	addUserIdToBody = (bodyKey = 'user') =>
		this.moveReqKeyToBody(bodyKey, 'user', '_id');

	static unavailable(req: Request, res: Response, next: NextFunction) {
		next(createError(404, `UNAVAILABLE: Can't access ${req.originalUrl}`));
	}
	static unauthorized(req: Request, res: Response, next: NextFunction) {
		next(createError(403, 'Unauthorized Access'));
	}

	condition(conditionalObj: ConditionalMiddleware) {
		return function (req: Request, res: Response, next: NextFunction) {
			const {
				if: conditions,
				then: middlewares,
				else: elseMiddlewares,
				negated
			} = conditionalObj;
			let result = true;
			conditions.forEach(cond => {
				let evaluated = cond(req);
				if (negated) evaluated = !evaluated;
				if (result) result = result && evaluated;
			});

			let error: undefined | Error = undefined;
			if (result)
				middlewares.forEach(middleware => {
					if (error !== undefined) return;
					middleware(req, res, err => {
						if (err) error = err;
					});
				});
			else if (elseMiddlewares)
				elseMiddlewares.forEach(middleware => {
					if (error !== undefined) return;
					middleware(req, res, err => {
						if (err) error = err;
					});
				});

			error === undefined ? next() : next(error);
		};
	}

	static authorizationSpecialKeys = {
		method: 'method:',
		async: 'async:'
	};
	authorizeOwnershipFactory(...nestedOwnerId: string[]) {
		return function (req: IRequest, res: Response, next: NextFunction) {
			let ownerId: any = req;
			nestedOwnerId.forEach(key => {
				if (ownerId[key]) ownerId = ownerId[key];
				else
					next(createError(400, `missing item from request: ${nestedOwnerId}`));
			});
			if (!req.user?._id.equals(ownerId))
				next(createError(403, 'not the owner of document'));
			else next();
		};
	}

	useAsParentParam(paramName: string) {
		return function (req: IRequest, res: Response, next: NextFunction) {
			req.isChildRouter = req.params[paramName];
			next();
		};
	}
	allowChildRouter(req: IRequest, res: Response, next: NextFunction) {
		if (!req.isChildRouter)
			next(createError(400, 'should be accessed through a parent route'));
		else next();
	}

	//#region CRUD operations:
	createOne = catchAsync(
		async (
			req: IRemoveFieldsRequest,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const document = await this.model.create(req.body);
			if (req.removeFields) {
				req.removeFields.forEach(field => {
					document[field] = undefined;
				});
			}

			req[this.modelName] = document;

			next();
		}
	);

	getAll = catchAsync(
		async (
			req: IFilterRequest,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const filter = req.defaultFilter || {};

			let query = this.model.find(filter);
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
	);
	getOne = catchAsync(
		async (
			req: IPopulateRequest,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			const id = req.params.id;

			let query = this.model.findById(id);
			// populate if needed
			if (req.populateArray) {
				req.populateArray.forEach(populateOptions => {
					query = query.populate(populateOptions);
				});
			}

			const document = await query.exec();
			if (!document) return next(createError(404, 'document not found'));

			req[this.modelName] = document;
			next();
		}
	);

	patchById = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
			if (isEmpty(req.body))
				return next(createError(400, 'no useful body was passed'));

			const document = await this.model
				.findByIdAndUpdate(req.params.id, req.body, {
					new: true,
					runValidators: true
				})
				.exec();
			if (!document) return next(createError(404, 'document not found'));

			req[this.modelName] = document;
			next();
		}
	);
	patchDocument = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
			if (isEmpty(req.body))
				return next(createError(400, 'no useful body was passed'));

			Object.keys(req.body).forEach(key => {
				req[this.modelName][key] = req.body[key];
			});
			req[this.modelName] = await req[this.modelName].save();

			next();
		}
	);

	deleteById = catchAsync(
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const document = await this.model.findByIdAndDelete(req.params.id).exec();
			if (!document) return next(createError(404, 'document not found'));

			next();
		}
	);
	deleteDocument = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
			await req[this.modelName].deleteOne();
			next();
		}
	);

	sendResponse = (operation: CRUD) => {
		return (req: IRequest, res: Response, next: NextFunction) => {
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

				case 'login':
				case 'getOne':
				case 'patch':
					res.status(200).json({
						status: 'success',
						data: req[this.modelName]
					});
					break;

				case 'logout':
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
		};
	};
	//#endregion
}
