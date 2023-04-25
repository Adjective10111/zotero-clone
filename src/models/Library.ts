import { Model, model, Query, Schema, Types } from 'mongoose';
import { Doc } from '../utils/types';
import Collection, {
	CollectionDoc,
	ICollection,
	type AnyCollectionDoc
} from './Collection';
import { type IUser } from './User';

const defaultCollectionNames = ['unfiled items', 'duplicates', 'bin'];

export interface ILibrary {
	user: Doc<IUser>;

	name: string;
	collections?: AnyCollectionDoc[];
	duplicates: AnyCollectionDoc;
	unfiledItems: AnyCollectionDoc;
	bin: AnyCollectionDoc;
}

interface ILibraryMethods {
	initialize(this: Doc<ILibrary>): Promise<void>;
	emptyBin(this: Doc<ILibrary>): Promise<void>;
	removeDuplicateCollections(this: Doc<ILibrary>): void;
}

type LibraryModel = Model<ILibrary, {}, ILibraryMethods>;

const librarySchema = new Schema<ILibrary, LibraryModel, ILibraryMethods>(
	{
		user: {
			type: Types.ObjectId,
			ref: 'User',
			required: [true, 'library should be for someone']
		},
		name: {
			type: String,
			required: [true, 'library must have a name']
		},

		duplicates: {
			type: Types.ObjectId,
			ref: 'Collection'
		},
		unfiledItems: {
			type: Types.ObjectId,
			ref: 'Collection'
		},
		bin: {
			type: Types.ObjectId,
			ref: 'Collection'
		}
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true
		}
	}
);

librarySchema.index({ user: 1, name: 1 }, { unique: true });

librarySchema.virtual('collections', {
	ref: 'Collection',
	foreignField: 'parent',
	localField: '_id'
});

librarySchema.methods.initialize = async function (): Promise<void> {
	const unfiledItems = await Collection.create({
		parent: this.id,
		name: 'unfiled items',
		type: 'Collection'
	});
	const duplicates = await Collection.create({
		parent: this.id,
		name: 'duplicates',
		type: 'SearchingCollection',
		searchQuery: {
			parent: this.id,
			$where: 'this.collections.length > 1'
		}
	});
	const bin = await Collection.create({
		parent: this.id,
		name: 'bin',
		type: 'Collection'
	});

	this.unfiledItems = unfiledItems.id;
	this.duplicates = duplicates.id;
	this.bin = bin.id;

	await this.save();
};
librarySchema.methods.emptyBin = async function (): Promise<void> {
	await (this.bin as CollectionDoc).empty();
};
librarySchema.methods.removeDuplicateCollections = function (): void {
	if (!this.populated('collections'))
		throw EvalError('collections are not populated');

	defaultCollectionNames.forEach(name => {
		let index = this.collections?.findIndex(doc => doc.name === name);
		if (index === undefined || index === -1) return;
		this.collections?.splice(index, 1);
	});
};

librarySchema.queue('initialize', []);

const Library = model<ILibrary, LibraryModel>('Library', librarySchema);
export default Library;
