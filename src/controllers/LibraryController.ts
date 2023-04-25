import { NextFunction, Response } from 'express';
import Collection from '../models/Collection';
import Library, { type ILibrary } from '../models/Library';
import Controller from '../utils/Controller';
import { wrapAsync } from '../utils/errorFactory';
import { Doc, IFilterRequest, IRequest } from '../utils/types';

interface ILRequest extends IRequest {
	library?: Doc<ILibrary>;
}

export class LibraryController extends Controller<typeof Library> {
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
		create: { mandatory: ['user', 'name'] },
		patch: { allowed: ['name'] }
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
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

	authorizeOwnership = () => {
		return super.authorizeOwnership(this.modelName, '_id');
	};

	@wrapAsync
	async deleteCollections(req: ILRequest, res: Response, next: NextFunction) {
		await req.library?.collections?.forEach(async collection => {
			if (Collection.isCollection(collection)) await collection.empty();
			await collection.deleteOne().exec();
		});

		next();
	}
}
