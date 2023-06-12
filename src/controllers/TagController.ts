import { NextFunction, Response } from 'express';
import Tag from '../models/Tag';
import Controller from '../utils/Controller';
import { catchAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class TagController extends Controller<typeof Tag> {
	constructor() {
		super(Tag);
	}

	getAll = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
			const documents = await this.model.find().exec();
			req[`${this.modelName}s`] = documents;
			next();
		}
	);
}
