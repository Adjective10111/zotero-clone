import { NextFunction, Response } from 'express';
import Item, { ItemDoc } from '../models/Item';
import Tag, { TagObject } from '../models/Tag';
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
	static async addLibToReq(req: IIRequest, res: Response, next: NextFunction) {
		if (!req.item?.populated('library')) await req.item?.populate('library');
		req.library = req.item?.library;
		next();
	}

	removeTagsFromBody(req: IRequest, res: Response, next: NextFunction) {
		req.tags = req.body.tags;
		req.body.tags = undefined;
		next();
	}

	@wrapAsync
	async checkTags(req: IIRequest, res: Response, next: NextFunction) {
		const tags: TagObject[] = req.tags || [];
		await Promise.all(
			tags.map(async (value: any): Promise<void> => {
				if (!value.name || !value.color)
					throw createError(400, 'invalid tags array');

				const { name, color } = value;
				let tag = await Tag.findOne({ item: req.item?.id, name, color });
				if (!tag) tag = await Tag.create({ item: req.item?.id, name, color });
			})
		);

		next();
	}

	@wrapAsync
	async deleteTags(req: IIRequest, res: Response, next: NextFunction) {
		await Tag.deleteMany({ item: req.item?.id });
		next();
	}
}
