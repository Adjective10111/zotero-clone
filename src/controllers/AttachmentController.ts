import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import Attachment, { AttachmentDoc } from '../models/Attachment';
import Item from '../models/Item';
import Controller from '../utils/Controller';
import { catchAsync, createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';
import FileController from './FileController';

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
		create: {
			mandatory: ['parent', 'name', 'type', 'filename']
		},
		patch: {
			allowed: ['parent', 'name', 'type']
		}
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: this.preventMaliciousBody(this.bodyKeys.patch)
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
		// '' 'api' 'collections' ...
		return req.originalUrl.split('/')[2] === 'collections';
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

	deleteDocument = catchAsync(
		async (
			req: IARequest,
			res: Response,
			next: NextFunction
		): Promise<void> => {
			if (!req.attachment) return next(createError(400, 'no attachment'));
			await FileController.deleteFile(req.attachment.filename);
			await req.attachment.deleteOne();
			next();
		}
	);
}
