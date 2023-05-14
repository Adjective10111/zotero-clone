import { NextFunction, Response } from 'express';
import AttachmentType from '../models/AttachmentType';
import Controller from '../utils/Controller';
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
		req.body.metadataKeys = (req.body.metadataKeys as string)?.split(',');

		next();
	}
}
