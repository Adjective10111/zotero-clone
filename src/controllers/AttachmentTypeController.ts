import { NextFunction, Response } from 'express';
import AttachmentType from '../models/AttachmentType';
import Controller from '../utils/Controller';
import { createError } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class AttachmentTypeController extends Controller<
	typeof AttachmentType
> {
	bodyKeys = {
		create: {
			allowed: ['icon'],
			mandatory: ['name', 'api', 'metadataKeys']
		},
		patch: {
			allowed: ['icon', 'api', 'metadataKeys']
		}
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: this.preventMaliciousBody(this.bodyKeys.patch)
	};

	constructor() {
		super(AttachmentType);
	}

	parseMetadataKeys(req: IRequest, res: Response, next: NextFunction) {
		const keys = req.body.metadataKeys;
		if (typeof keys === 'string')
			req.body.metadataKeys = keys.split(',');
		else if (!keys.length)
			return next(createError(401, 'metadataKeys must be of type string or array'));

		next();
	}
}
