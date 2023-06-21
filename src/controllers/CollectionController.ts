import { NextFunction, Response } from 'express';
import Collection, {
	CollectionDoc,
	collectionTypes
} from '../models/Collection';
import Controller from '../utils/Controller';
import { catchAsync, createError, wrapAsync } from '../utils/errorFactory';
import { IFilterRequest, IRequest } from '../utils/types';

interface ICRequest extends IRequest {
	collection?: CollectionDoc;
}

export default class CollectionController extends Controller<
	typeof Collection
> {
	populateOptions = {
		parent: {
			path: 'parent'
		},
		items: {
			path: 'items'
		},
		notes: {
			path: 'notes'
		}
	};
	queuePopulateField = {
		parent: this.createPopulateArray(this.populateOptions.parent),
		data: this.createPopulateArray(
			this.populateOptions.items,
			this.populateOptions.notes
		)
	};

	bodyKeys = {
		create: { allowed: ['type', 'searchQuery'], mandatory: ['name', 'parent'] },
		patch: { allowed: ['name', 'searchQuery'] }
	};
	validateBody = {
		create: catchAsync(
			async (req: IRequest, res: Response, next: NextFunction) => {
				if (!req.body.type) req.body.type = collectionTypes.collection;
				this.preventMaliciousBody(this.bodyKeys.create)(req, res, err => {
					if (err) return next(err);

					if (
						req.body.type === collectionTypes.searchingCollection &&
						!req.body.searchQuery
					)
						next(createError(400, 'invalid body'));
					else next();
				});
			}
		),
		patch: catchAsync(
			async (req: IRequest, res: Response, next: NextFunction) => {
				this.preventMaliciousBody(this.bodyKeys.patch)(req, res, err => {
					if (err) return next(err);

					if (
						req.collection.type === collectionTypes.collection &&
						!!req.body.searchQuery
					)
						next(createError(400, 'invalid body'));
					else next();
				});
			}
		)
	};

	addLibraryToBody = this.moveReqKeyToBody('parent', 'library', 'id');

	constructor() {
		super(Collection);
	}

	filterByCollection(req: IFilterRequest, res: Response, next: NextFunction) {
		req.defaultFilter = {
			...(req.defaultFilter || {}),
			collections: { $elemMatch: { $eq: req.collection?.id } }
		};
		next();
	}

	@wrapAsync
	static async addLibToReq(req: ICRequest, res: Response, next: NextFunction) {
		if (!req.collection?.populated('parent'))
			await req.collection?.populate('parent');
		req.library = req.collection?.parent;
	}
}
