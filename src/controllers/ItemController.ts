import { NextFunction, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import Item, { ItemDoc } from '../models/Item';
import Library from '../models/Library';
import Tag from '../models/Tag';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface IIRequest extends IRequest {
	item?: ItemDoc;
}

export default class ItemController extends Controller<typeof Item> {
	populateOptions = {
		parentCollection: {
			path: 'parentCollection'
		},
		library: {
			path: 'library',
			select: '-collections -duplicates -unfiledItems -bin'
		},
		attachments: {
			path: 'attachments'
		},
		notes: {
			path: 'notes'
		},
		related: {
			path: 'related.item',
			select: 'name itemType parentCollection'
		}
	};
	queuePopulateField = {
		parent: this.createPopulateArray(this.populateOptions.library),
		data: this.createPopulateArray(
			this.populateOptions.attachments,
			this.populateOptions.notes,
			this.populateOptions.related
		)
	};

	bodyKeys = {
		create: {
			allowed: ['primaryAttachment', 'itemType', 'metadata', 'tags', 'related'],
			mandatory: ['name', 'library', 'parentCollection']
		},
		patch: {
			allowed: [
				'name',
				'parentCollection',
				'primaryAttachment',
				'itemType',
				'metadata',
				'related',
				'tags'
			]
		}
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: this.preventMaliciousBody(this.bodyKeys.patch)
	};

	addLibraryToBodyFromCollection = this.moveReqKeyToBody(
		'library',
		'collection',
		'parent'
	);

	constructor() {
		super(Item);
	}

	addCollectionToBody = this.moveReqKeyToBody(
		'parentCollection',
		'collection',
		'id'
	);

	@wrapAsync
	static async authorizeEdit(
		req: IIRequest,
		res: Response,
		next: NextFunction
	) {
		if (await req.item?.library?.canEdit(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}
	@wrapAsync
	static async authorizeView(
		req: IIRequest,
		res: Response,
		next: NextFunction
	) {
		if (await req.item?.library?.canView(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}

	@wrapAsync
	async checkTags(req: IRequest, res: Response, next: NextFunction) {
		const tags: any[] = req.body.tags;
		tags.map(async (value: any): Promise<Types.ObjectId> => {
			if (isValidObjectId(value)) return value;
			if (value.name && value.color) {
				const { name, color } = value;
				const tag = await Tag.create({ name, color });
				return tag.id;
			}
			throw createError(400, 'invalid tags array');
		});

		next();
	}

	@wrapAsync
	async searchByTag(req: IRequest, res: Response, next: NextFunction) {
		const tag = req.params.tag;
		const libraries = await Library.find({ owner: req.user?.id });
		req[`${this.modelName}s`] = await Item.searchTag(tag, {
			$match: { library: { $in: libraries } }
		});

		next();
	}
}
