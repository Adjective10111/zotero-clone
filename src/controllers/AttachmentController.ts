import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import Attachment, { AttachmentDoc } from '../models/Attachment';
import Item from '../models/Item';
import Controller from '../utils/Controller';
import { catchAsync, createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface IARequest extends IRequest {
	attachment?: AttachmentDoc;
}

export default class AttachmentController extends Controller<
	typeof Attachment
> {
	populateOptions = {
		parent: {
			path: 'parent'
		},
		type: {
			path: 'type'
		}
	};
	queuePopulateField = {
		parent: this.createPopulateArray(this.populateOptions.parent),
		type: this.createPopulateArray(this.populateOptions.type)
	};

	bodyKeys = {
		createBeforePath: {
			mandatory: ['parent', 'name', 'type']
		},
		create: {
			mandatory: ['parent', 'name', 'type', 'path']
		},
		patch: {
			allowed: ['parent', 'name', 'type']
		}
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: this.preventMaliciousBody(this.bodyKeys.patch),
		itemCreator: (req: IRequest, res: Response, next: NextFunction) => {
			this.preventMaliciousBody(this.bodyKeys.createBeforePath)(
				req,
				res,
				err => {
					if (err) return next(err);

					if (typeof req.body.parent === 'object') {
						let allowed = ['metadata', 'tag', 'related'];
						let mandatory = ['name'];
						allowed = allowed.concat(mandatory);
						if (
							mandatory.every(value => req.body.parent[value]) &&
							Object.keys(req.body.parent).every(value =>
								allowed.includes(value)
							)
						)
							next();
						else next(createError(400, 'invalid body'));
					} else next(createError(400, 'invalid body'));
				}
			);
		}
	};

	addItemToBody = this.moveReqKeyToBody('parent', 'item', 'id');

	constructor() {
		super(Attachment);
	}

	@wrapAsync
	static async authorizeEdit(
		req: IARequest,
		res: Response,
		next: NextFunction
	) {
		await req.attachment?.parent.populate('library');
		if (await req.attachment?.parent.library?.canEdit(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}
	@wrapAsync
	static async authorizeView(
		req: IARequest,
		res: Response,
		next: NextFunction
	) {
		await req.attachment?.parent.populate('library');
		if (await req.attachment?.parent.library?.canView(req.user?.id)) next();
		else next(createError(403, 'unauthorized'));
	}

	isParentCollections(req: IRequest): boolean {
		return req.originalUrl.split('/')[1] === 'collections';
	}

	async createItemByParentObj(
		req: IRequest,
		res: Response,
		next: NextFunction
	) {
		const itemBody = req.body.parent;
		itemBody.library = req.collection?.library?.id;
		itemBody.parentCollection = req.collection?.id;
		itemBody.itemType = req.body.type;
		itemBody.primaryAttachment = Types.ObjectId.generate();

		req.item = await Item.create(itemBody);
		req.body.parent = req.item.id;
		req.putAsPrimaryAttachment = true;

		next();
	}

	createOne = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
			const document = await this.model.create(req.body);
			if (req.putAsPrimaryAttachment) {
				req.item.primaryAttachment = document.id;
				await req.item.save();
			}

			req[this.modelName] = document;

			next();
		}
	);
}
