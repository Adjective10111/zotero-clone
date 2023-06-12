import { Schema, Types, model, type FilterQuery, type Model } from 'mongoose';
import { isEmpty } from '../utils/basicFunctions';
import { ITimestamped, type Doc } from '../utils/types';
import Item, { type IItem } from './Item';
import { type LibraryDoc } from './Library';
import { type INote } from './Note';

export const collectionTypes = {
	searchingCollection: 'SearchingCollection',
	collection: 'Collection',
	values: ['SearchingCollection', 'Collection']
};
interface IStdCollection extends ITimestamped {
	name: string;
	parent: LibraryDoc;

	items?: Doc<IItem>[];
}

export interface ISearchingCollection extends IStdCollection {
	type: 'SearchingCollection';
	searchQuery: FilterQuery<IItem>;
}

export interface ICollection extends IStdCollection {
	type: 'Collection';
	notes?: INote[];
}

export type AnyCollection = ICollection | ISearchingCollection;

interface CollectionMethods {
	empty(this: Doc<ICollection>): Promise<void>;
	searchItems(this: Doc<ISearchingCollection>): Promise<void>;
}

interface CollectionModel extends Model<AnyCollection, {}, CollectionMethods> {
	isSearchingCollection(
		doc: Doc<AnyCollection>
	): doc is Doc<ISearchingCollection>;
	isCollection(doc: Doc<AnyCollection>): doc is Doc<ICollection>;
}

export type AnyCollectionDoc = Doc<AnyCollection, CollectionMethods>;
export type SearchingCollectionDoc = Doc<
	ISearchingCollection,
	CollectionMethods
>;
export type CollectionDoc = Doc<ICollection, CollectionMethods>;

const collectionSchema = new Schema<
	AnyCollection,
	CollectionModel,
	CollectionMethods
>(
	{
		name: {
			type: String,
			required: [true, 'collection must be named']
		},
		parent: {
			type: Types.ObjectId,
			ref: 'Library',
			required: [true, 'it must belong to a library']
		},

		type: {
			type: String,
			required: [true, 'for better performance include the type'],
			validate: {
				validator: function (value: string): boolean {
					return collectionTypes.values.includes(value);
				},
				message: `type must be either "${collectionTypes.values.join(
					'" or "'
				)}"`
			}
		},
		searchQuery: {
			type: Object,
			validate: {
				validator: function (this: AnyCollection, value: Object): boolean {
					let validation = isEmpty(value);
					if (this.type === 'SearchingCollection') validation = !validation;
					return validation;
				},
				message: 'searchQuery must be specified in a SearchingCollection'
			}
		}
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true
		}
	}
);

collectionSchema.index({ name: 1, parent: 1 }, { unique: true });

collectionSchema.virtual('items', {
	ref: 'Item',
	foreignField: 'parentCollection',
	localField: '_id'
});

collectionSchema.virtual('notes', {
	ref: 'Note',
	foreignField: 'parent',
	localField: '_id'
});

collectionSchema.methods.searchItems = async function (
	this: Doc<ISearchingCollection>
): Promise<void> {
	this.items = await Item.find(this.searchQuery).exec();
};
collectionSchema.methods.empty = async function (
	this: Doc<ICollection>
): Promise<void> {
	await this.populate('items');
	this.items?.forEach(async item => await item.deleteOne());
};

collectionSchema.statics.isSearchingCollection = function (
	doc: Doc<AnyCollection>
): doc is Doc<ISearchingCollection> {
	return doc.type === 'SearchingCollection';
};
collectionSchema.statics.isCollection = function (
	doc: Doc<AnyCollection>
): doc is Doc<ICollection> {
	return doc.type === 'Collection';
};

const Collection = model<AnyCollection, CollectionModel>(
	'Collection',
	collectionSchema
);
export default Collection;
