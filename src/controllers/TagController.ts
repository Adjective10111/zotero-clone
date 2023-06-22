import { NextFunction, Response } from 'express';
import Item from '../models/Item';
import Tag from '../models/Tag';
import Controller from '../utils/Controller';
import { catchAsync, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class TagController extends Controller<typeof Tag> {
	constructor() {
		super(Tag);
	}

	filterByUser = this.filterByOwnerFactory('user');

	getTagsByParentId(parentMode: 'parentCollection' | 'library') {
		return catchAsync(
			async (req: IRequest, res: Response, next: NextFunction) => {
				req.tags = await Item.aggregate([
					{
						$match: {
							[parentMode]: req.params.id,
							tags: { $exists: true, $ne: [] }
						}
					},
					{
						$project: { tags: 1 }
					},
					{
						$lookup: {
							from: 'tags',
							localField: 'tags',
							foreignField: '_id',
							as: 'tagList'
						}
					},
					{
						$unwind: '$tagList'
					},
					{
						$replaceWith: '$tagList'
					}
				]).exec();

				next();
			}
		);
	}
}
