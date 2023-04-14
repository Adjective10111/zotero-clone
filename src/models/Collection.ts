import mongoose, {
	Schema,
	model,
	type FilterQuery,
	type Model
} from 'mongoose';
import { type Doc } from '../utils/schemaFactory';
import Item, { type IItem } from './Item';
import { type ILibrary } from './Library';
import { type INote } from './Note';

interface IStdCollection {
	name: string;
	parent: ILibrary;

	items?: IItem[];
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

interface CollectionModel extends Model<AnyCollection> {
	isSearchingCollection(
		doc: Doc<AnyCollection>
	): doc is Doc<ISearchingCollection>;

	searchItems(
		doc: Doc<ISearchingCollection>
	): Promise<Doc<ISearchingCollection>>;
}

const collectionSchema = new Schema<AnyCollection, CollectionModel>(
	{
		name: {
			type: String,
			required: [true, 'collection must be named']
		},
		parent: {
			type: mongoose.Types.ObjectId,
			ref: 'Library',
			required: [true, 'it must belong to a library']
		},

		type: {
			type: String,
			required: [true, 'for better performance include the type']
		},
		searchQuery: Object
	},
	{
		toJSON: {
			virtuals: true
		}
	}
);

collectionSchema.index({ name: 1, parent: 1 }, { unique: true });

collectionSchema.virtual('items', {
	ref: 'Item',
	foreignField: 'parent',
	localField: '_id'
});

collectionSchema.virtual('notes', {
	ref: 'Note',
	foreignField: 'parent',
	localField: '_id'
});

collectionSchema.statics.isSearchingCollection = function (
	doc: Doc<AnyCollection>
): doc is Doc<ISearchingCollection> {
	return doc.type === 'SearchingCollection';
};

collectionSchema.statics.searchItems = async function (
	doc: Doc<ISearchingCollection>
): Promise<Doc<ISearchingCollection>> {
	doc.items = await Item.find(doc.searchQuery);
	return doc;
};

const Collection = model<AnyCollection, CollectionModel>(
	'Collection',
	collectionSchema
);
export default Collection;
