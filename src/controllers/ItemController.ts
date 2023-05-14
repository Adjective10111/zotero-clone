import { NextFunction, Response } from 'express';
import Item, { ItemDoc } from '../models/Item';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface IIRequest extends IRequest {
	item?: ItemDoc;
}

export class ItemController extends Controller<typeof Item> {
	populateOptions = {
		parent: {
			path: 'parent'
		},
		attachments: {
			path: 'attachments'
		},
		notes: {
			path: 'notes'
		}
	};
	queuePopulateField = {
		parent: this.createPopulateArray(this.populateOptions.parent),
		data: this.createPopulateArray(
			this.populateOptions.attachments,
			this.populateOptions.notes
		)
	};

	bodyKeys = {
		create: {
			allowed: ['collections', 'metadata', 'tag', 'related'],
			mandatory: ['name', 'parent', 'primaryAttachment', 'itemType']
		},
		patch: { allowed: ['name', 'collections', 'metadata', 'related', 'tag'] }
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: this.preventMaliciousBody(this.bodyKeys.patch)
	};

	addLibraryToBodyFromCollection = this.moveReqKeyToBody(
		'parent',
		'collection',
		'parent'
	);
	addLibraryToBodyFromReq = this.moveReqKeyToBody('parent', 'library', 'id');

	constructor() {
		super(Item);
	}

	isParentLibrary(req: IRequest): boolean {
		return !!req.library;
	}
	isParentCollection(
		req: IRequest,
		res: Response,
		next: NextFunction
	): boolean {
		return !!req.collection;
	}

	@wrapAsync
	async authorizeEdit(req: IIRequest, res: Response, next: NextFunction) {
		if (await req.item?.parent?.canEdit(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}
	@wrapAsync
	async authorizeView(req: IIRequest, res: Response, next: NextFunction) {
		if (await req.item?.parent?.canView(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}
}
