import { NextFunction, Response } from 'express';
import Collection, { AnyCollectionDoc } from '../models/Collection';
import Item from '../models/Item';
import Library, { LibraryDoc } from '../models/Library';
import Tag from '../models/Tag';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface ICRequest extends IRequest {
	collection?: AnyCollectionDoc;
}
interface ILRequest extends IRequest {
	library?: LibraryDoc;
}

export default class TagController extends Controller<typeof Tag> {
	constructor() {
		super(Tag);
	}

	@wrapAsync
	async getTagsOfItem(req: IRequest, res: Response, next: NextFunction) {
		req.tags = await Tag.find(
			{ item: req.params.id },
			{ name: 1, color: 1, item: 0 }
		);
		next();
	}
	@wrapAsync
	async getTagsOfItemsOfCollection(
		req: ICRequest,
		res: Response,
		next: NextFunction
	) {
		if (!req.collection) throw createError(404, 'No Collection Found');

		if (Collection.isSearchingCollection(req.collection))
			await req.collection.searchItems();
		else req.collection.populate('items');

		const itemIds = req.collection.items?.map(value => value._id);
		req.tags = await Tag.find(
			{ item: { $in: itemIds } },
			{ name: 1, color: 1, item: 0 }
		);

		next();
	}
	@wrapAsync
	async getTagsOfItemsOfLibrary(
		req: ILRequest,
		res: Response,
		next: NextFunction
	) {
		if (!req.library) throw createError(404, 'No Collection Found');

		req.tags = await Item.aggregate([
			// getting all the library's items
			{
				$match: { library: req.library.id }
			},
			{
				$project: { _id: 1 }
			},
			// getting their tags
			{
				$lookup: {
					from: 'tags',
					localField: '_id',
					foreignField: 'item',
					as: 'tags'
				}
			},
			// replacing tags as the root
			{
				$unwind: '$tags'
			},
			{
				$replaceWith: '$tags'
			},
			// grouping the tags with the same name
			{
				$group: {
					_id: '$name',
					color: {
						$first: '$color'
					}
				}
			}
		]).exec();

		next();
	}
	@wrapAsync
	async getTagsOfItemsOfUser(req: IRequest, res: Response, next: NextFunction) {
		if (!req.user) throw createError(403, 'Please Login');

		req.tags = await Library.aggregate([
			// getting libraries owned by user
			{
				$match: { owner: req.user.id }
			},
			{
				$project: { _id: 1 }
			},
			// getting the items of these libraries
			{
				$lookup: {
					from: 'items',
					let: {
						libraryId: '$_id'
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ['$library', '$$libraryId']
								}
							}
						},
						// only getting the items' ids
						{
							$project: { _id: 1 }
						}
					],
					as: 'items'
				}
			},
			// replacing items as the root objects
			{
				$unwind: '$items'
			},
			{
				$replaceWith: '$items'
			},
			// getting the tags of these items
			{
				$lookup: {
					from: 'tags',
					localField: '_id',
					foreignField: 'item',
					as: 'tags'
				}
			},
			// replacing tags as the root objects
			{
				$unwind: '$tags'
			},
			{
				$replaceWith: '$tags'
			},
			// grouping the tags with the same name
			{
				$group: {
					_id: '$name',
					color: {
						$first: '$color'
					}
				}
			}
		]).exec();

		next();
	}

	// @wrapAsync
	// async getItemsByTags(req: IRequest, res: Response, next: NextFunction) {
	// 	const tag = req.params.tag;
	// 	const tagDoc = (await Tag.findById(tag)) || { user: null };
	// 	if (!tagDoc.user?.equals(req.user?.id))
	// 		throw createError(403, 'unauthorized access');

	// 	req.items = await Item.aggregate([
	// 		{
	// 			$unwind: '$tags'
	// 		},
	// 		{
	// 			$match: { tags: new Types.ObjectId(tag) }
	// 		}
	// 	]).exec();

	// 	next();
	// }
	// @wrapAsync
	// async getCollectionsByTags(req: IRequest, res: Response, next: NextFunction) {}
	// @wrapAsync
	// async getLibrariesByTags(req: IRequest, res: Response, next: NextFunction) {
	// 	const tag = req.params.tag;
	// 	const tagDoc = (await Tag.findById(tag)) || { user: null };
	// 	if (!tagDoc.user?.equals(req.user?.id))
	// 		throw createError(403, 'unauthorized access');

	// 	const aggregation = await Item.aggregate([
	// 		{
	// 			$unwind: '$tags'
	// 		},
	// 		{
	// 			$match: { tags: new Types.ObjectId(tag) }
	// 		},
	// 		{
	// 			$group: {
	// 				_id: '$library'
	// 			}
	// 		},
	// 		{
	// 			$lookup: {
	// 				from: 'libraries',
	// 				localField: '_id',
	// 				foreignField: '_id',
	// 				as: 'libraries'
	// 			}
	// 		}
	// 	]).exec();

	// 	const libraries: object[] = [];
	// 	aggregation.forEach(value => {
	// 		libraries.push(...value.libraries);
	// 	});
	// 	req[`${'library'}s`] = libraries;

	// 	next();
	// }
}
