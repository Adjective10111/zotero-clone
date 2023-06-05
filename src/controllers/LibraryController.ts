import { NextFunction, Response } from 'express';
import Collection from '../models/Collection';
import Group from '../models/Group';
import Library, { type LibraryDoc } from '../models/Library';
import Controller from '../utils/Controller';
import { catchAsync, createError, wrapAsync } from '../utils/errorFactory';
import { IFilterRequest, IRequest } from '../utils/types';

interface ILRequest extends IRequest {
	library?: LibraryDoc;
}

export default class LibraryController extends Controller<typeof Library> {
	populateOptions = {
		duplicates: {
			path: 'duplicates'
		},
		unfiledItems: {
			path: 'unfiledItems'
		},
		bin: {
			path: 'bin'
		},
		collections: {
			path: 'collections'
		}
	};
	queuePopulateField = {
		all: this.createPopulateArray(
			this.populateOptions.duplicates,
			this.populateOptions.unfiledItems,
			this.populateOptions.bin,
			this.populateOptions.collections
		),
		collections: this.createPopulateArray(this.populateOptions.collections)
	};

	bodyKeys = {
		create: { allowed: ['owner', 'group', 'private'], mandatory: ['name'] },
		patch: { allowed: ['name', 'group', 'private'] }
	};
	validateBody = {
		create: catchAsync(
			async (req: IRequest, res: Response, next: NextFunction) => {
				if (req.body.group) {
					if (req.body.owner) return next(createError(400, 'invalid body'));
					const group = await Group.findById(req.body.group);
					if (!group) return next(createError(400, 'invalid group'));
					req.body.owner = group.owner;
				} else req.body.owner = req.user?.id;

				this.preventMaliciousBody(this.bodyKeys.create)(req, res, next);
			}
		),
		patch: this.preventMaliciousBody(this.bodyKeys.patch)
	};

	constructor() {
		super(Library);
	}

	filterByLibrary(req: IFilterRequest, res: Response, next: NextFunction) {
		req.defaultFilter = {
			...(req.defaultFilter || {}),
			parent: req.library?.id
		};
		next();
	}

	filterByOwner = super.filterByOwnerFactory('owner');

	authorizeOwnership = super.authorizeOwnershipFactory(this.modelName, 'owner');
	@wrapAsync
	static async authorizeView(
		req: ILRequest,
		res: Response,
		next: NextFunction
	) {
		if (await req.library?.canView(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}
	@wrapAsync
	static async authorizeEdit(
		req: ILRequest,
		res: Response,
		next: NextFunction
	) {
		if (await req.library?.canEdit(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}

	@wrapAsync
	async deleteCollections(req: ILRequest, res: Response, next: NextFunction) {
		await req.library?.collections?.forEach(async collection => {
			if (Collection.isCollection(collection)) await collection.empty();
			await collection.deleteOne().exec();
		});

		next();
	}

	async initializeLibrary(req: ILRequest, res: Response, next: NextFunction) {
		await req.library?.initialize();
		next();
	}

	async emptyBin(req: ILRequest, res: Response, next: NextFunction) {
		await req.library?.emptyBin();
		next();
	}
}
