import mongoose, { Schema, model, type HydratedDocument, type Model } from "mongoose";
import { type IItem } from "./Item";
import { type ILibrary } from "./Library";
import { type INote } from "./Note";

interface libraryOwned {
	name: string;
	parent: ILibrary;
}

export interface ISearchingCollection extends libraryOwned {
	type: 'SearchingCollection'
	searchQuery: string;
}

export interface ICollection extends libraryOwned {
	type: 'Collection'
	items?: IItem[];
	notes?: INote[];
}

export type AnyCollection = ICollection | ISearchingCollection;
type Doc<T> = HydratedDocument<T>;

interface CollectionModel extends Model<AnyCollection> {
	isSearchingCollection(doc: Doc<AnyCollection>): doc is Doc<ISearchingCollection>;
	isNormalCollection(doc: Doc<AnyCollection>): doc is Doc<ICollection>;
}

const collectionSchema = new Schema<AnyCollection, CollectionModel>({
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
	searchQuery: String
}, {
	toJSON: {
		virtuals: true
	}
});

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

collectionSchema.statics.isSearchingCollection = 
	function(doc: Doc<AnyCollection>): doc is Doc<ISearchingCollection> {
		return doc.type === 'SearchingCollection';
	}

collectionSchema.statics.isNormalCollection = 
	function(doc: Doc<AnyCollection>): doc is Doc<ICollection> {
		return doc.type === 'Collection';
	}

const Collection = model<AnyCollection, CollectionModel>('Collection', collectionSchema);
export default Collection;
