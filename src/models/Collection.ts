import mongoose, { model, Schema } from "mongoose";
import { IItem } from "./Item";
import { ILibrary } from "./Library";

export interface ISearchingCollection {
	name: string;
	library: mongoose.Types.ObjectId;
	searchQuery: string;
}

export interface ICollection {
	name: string;
	library: ILibrary;
	entries?: IItem[];
}

export type AnyCollection = ICollection | ISearchingCollection;

const collectionSchema = new Schema<AnyCollection>({
	name: {
		type: String,
		required: [true, 'collection must be named']
	},
	library: {
		type: mongoose.Types.ObjectId,
		ref: 'Library',
		required: [true, 'it must belong to a library']
	},
	searchQuery: String
});

const Collection = model<AnyCollection>('Collection', collectionSchema);
export default Collection;
