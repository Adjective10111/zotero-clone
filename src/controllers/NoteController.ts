import { NextFunction, Response } from 'express';
import Note, { NoteDoc } from '../models/Note';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface INRequest extends IRequest {
	note?: NoteDoc;
}

export default class NoteController extends Controller<typeof Note> {
	@wrapAsync
	async populateParent(req: INRequest, res: Response, next: NextFunction) {
		if (!req.note) return next(createError(400, 'no note available'));
		await req.note.populateReference();

		next();
	}

	bodyKeys = {
		create: {
			mandatory: ['parent', 'parentModel', 'text']
		},
		patch: {
			allowed: ['parent', 'parentModel', 'text']
		}
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: (req: IRequest, res: Response, next: NextFunction) => {
			this.preventMaliciousBody(this.bodyKeys.patch)(req, res, err => {
				if (err) return next(err);

				if (!req.body.parentModel && req.body.parent)
					next(createError(400, 'invalid body'));
				else next();
			});
		}
	};

	addItemToBody = (req: IRequest, res: Response, next: NextFunction) => {
		this.moveReqKeyToBody('parent', 'item', 'id')(req, res, err => {
			if (err) return next(err);

			req.body.parentModel = 'parentItem';
			next();
		});
	};
	addCollectionToBody = (req: IRequest, res: Response, next: NextFunction) => {
		this.moveReqKeyToBody('parent', 'collection', 'id')(req, res, err => {
			if (err) return next(err);

			req.body.parentModel = 'parentCollection';
			next();
		});
	};

	constructor() {
		super(Note);
	}

	@wrapAsync
	static async addLibToReq(req: INRequest, res: Response, next: NextFunction) {
		if (req.note?.parentModel === 'parentItem') {
			await req.note?.parentItem?.populate('library');
			req.library = req.note?.parentItem?.library;
		} else {
			await req.note?.parentCollection?.populate('parent');
			req.library = req.note?.parentCollection?.parent;
		}
		next();
	}

	isParentCollections(req: IRequest): boolean {
		return req.originalUrl.split('/')[2] === 'collections';
	}
}
