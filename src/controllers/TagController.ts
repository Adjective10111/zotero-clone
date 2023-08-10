import { NextFunction, Response } from 'express';
import { PipelineStage, type ObjectId } from 'mongoose';
import Collection, { AnyCollectionDoc } from '../models/Collection';
import Item from '../models/Item';
import Library, { LibraryDoc } from '../models/Library';
import Tag, { TagDoc } from '../models/Tag';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

interface ICRequest extends IRequest {
	collection?: AnyCollectionDoc;
}
interface ILRequest extends IRequest {
	library?: LibraryDoc;
}
interface ITRequest extends IRequest {
	tag?: TagDoc;
}

export default class TagController extends Controller<typeof Tag> {
	constructor() {
		super(Tag);
	}

	populateItem = this.createPopulateArray({ path: 'item' });
	addItemToReq(req: ITRequest, res: Response, next: NextFunction) {
		req.item = req.tag?.item;
	}

	@wrapAsync
	async getTagsOfItem(req: IRequest, res: Response, next: NextFunction) {
		req.tags = await Tag.find({ item: req.params.id }, { name: 1, color: 1 });
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
		else await req.collection.populate('items');

		const itemIds = req.collection.items?.map(value => value._id);
		req.tags = await Tag.aggregate([
			{
				$match: { item: { $in: itemIds } }
			},
			{
				$group: {
					_id: '$name',
					color: {
						$first: '$color'
					}
				}
			}
		]);

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
				$match: { library: req.library._id }
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
				$match: { owner: req.user._id }
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

	@wrapAsync
	async getLibrariesByTags(req: IRequest, res: Response, next: NextFunction) {
		const tags = req.body.tagNames;

		const libraries = await Library.aggregate([
			{
				$match: { owner: req.user?._id }
			},
			{
				$lookup: {
					from: 'items',
					let: {
						libraryId: '$_id'
					},
					pipeline: [
						// getting all the library's items
						{
							$match: { library: '$$libraryId' }
						},
						{
							$project: { _id: 1 }
						},
						// getting their tags
						{
							$lookup: {
								from: 'tags',
								let: {
									itemId: '$_id'
								},
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{
														$eq: ['$item', '$$itemId']
													},
													{
														$in: ['$name', tags]
													}
												]
											}
										}
									}
								],
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
					],
					as: 'tags'
				}
			},
			// remove the ones with no tag with those conditions
			{
				$match: {
					$expr: {
						$gt: [{ $size: '$tags' }, 0]
					}
				}
			}
		]).exec();

		req[`${'library'}s`] = libraries;
		next();
	}
	@wrapAsync
	async getCollectionsByTags(req: IRequest, res: Response, next: NextFunction) {
		const tags = req.body.tagNames;

		const collections = await Library.aggregate([
			{
				$match: { owner: req.user?._id }
			},
			{
				$lookup: {
					from: 'items',
					let: {
						libraryId: '$_id'
					},
					pipeline: [
						// getting all the library's items
						{
							$match: { library: '$$libraryId' }
						},
						// getting their tags
						{
							$lookup: {
								from: 'tags',
								let: {
									itemId: '$_id'
								},
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{
														$eq: ['$item', '$$itemId']
													},
													{
														$in: ['$name', tags]
													}
												]
											}
										}
									}
								],
								as: 'tags'
							}
						},
						// remove the ones with no tag with those conditions
						{
							$match: {
								$expr: {
									$gt: [{ $size: '$tags' }, 0]
								}
							}
						}
					],
					as: 'items'
				}
			},
			// replace items as the root
			{
				$unwind: '$items'
			},
			{
				$replaceWith: '$items'
			},
			// group by parentCollection to avoid duplicates
			{
				$group: {
					_id: '$parentCollection'
				}
			},
			// lookup and replace collections as root
			{
				$lookup: {
					from: 'collections',
					localField: '_id',
					foreignField: '_id',
					as: 'collections'
				}
			},
			{
				$unwind: '$collections'
			},
			{
				$replaceWith: '$collections'
			}
		]).exec();

		req.collections = collections;
		next();
	}
	@wrapAsync
	async getItemsByTags(req: IRequest, res: Response, next: NextFunction) {
		const tags = req.body.tagNames;

		const items = await Library.aggregate([
			{
				$match: { owner: req.user?._id }
			},
			{
				$lookup: {
					from: 'items',
					let: {
						libraryId: '$_id'
					},
					pipeline: [
						// getting all the library's items
						{
							$match: { library: '$$libraryId' }
						},
						// getting their tags
						{
							$lookup: {
								from: 'tags',
								let: {
									itemId: '$_id'
								},
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{
														$eq: ['$item', '$$itemId']
													},
													{
														$in: ['$name', tags]
													}
												]
											}
										}
									}
								],
								as: 'tags'
							}
						},
						// remove the ones with no tag with those conditions
						{
							$match: {
								$expr: {
									$gt: [{ $size: '$tags' }, 0]
								}
							}
						}
					],
					as: 'items'
				}
			},
			// replace items as the root
			{
				$unwind: '$items'
			},
			{
				$replaceWith: '$items'
			}
		]).exec();

		req.items = items;
		next();
	}
}
