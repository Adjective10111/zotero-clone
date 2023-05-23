import { Model, model, Schema, Types } from 'mongoose';
import { Doc } from '../utils/types';
import Collection, { CollectionDoc, type AnyCollectionDoc } from './Collection';
import { GroupDoc } from './Group';
import { type UserDoc } from './User';

const defaultCollectionNames = ['unfiled items', 'duplicates', 'bin'];

interface ILibrary {
	owner: UserDoc | Types.ObjectId;
	group?: GroupDoc;
	private: boolean;

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
	canEdit(this: Doc<ILibrary>, userId: Types.ObjectId): Promise<boolean>;
	canView(this: Doc<ILibrary>, userId: Types.ObjectId): Promise<boolean>;
}

export type LibraryDoc = Doc<ILibrary, ILibraryMethods>;
type LibraryModel = Model<ILibrary, {}, ILibraryMethods>;

// private -> private ; !private && group -> publicView ; !private && !group -> publicFullAccess
const librarySchema = new Schema<ILibrary, LibraryModel, ILibraryMethods>(
	{
		owner: {
			type: Types.ObjectId,
			ref: 'User',
			required: [true, 'library should be for someone']
		},
		group: {
			type: Types.ObjectId,
			ref: 'Group'
		},
		private: {
			type: Boolean,
			default: false
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
			library: this.id,
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
	if (!this.populated('collections')) return;

	defaultCollectionNames.forEach(name => {
		let index = this.collections?.findIndex(doc => doc.name === name);
		if (index === undefined || index === -1) return;
		this.collections?.splice(index, 1);
	});
};
librarySchema.methods.canEdit = async function (
	userId: Types.ObjectId
): Promise<boolean> {
	if (!this.group && !this.private) return true;

	let ownerId: Types.ObjectId;
	if (this.populated('owner')) ownerId = this.owner.id;
	else ownerId = this.owner as Types.ObjectId;
	if (ownerId.equals(userId)) return true;

	if (!this.populated('group')) await this.populate('group');
	return this.group?.has(userId) as boolean;
};
librarySchema.methods.canView = async function (
	userId: Types.ObjectId
): Promise<boolean> {
	if (!this.private) return true;

	let ownerId: Types.ObjectId;
	if (this.populated('owner')) ownerId = this.owner.id;
	else ownerId = this.owner as Types.ObjectId;
	if (ownerId.equals(userId)) return true;

	if (!this.populated('group')) await this.populate('group');
	return this.group?.has(userId) as boolean;
};

librarySchema.post(/find/, function (found: LibraryDoc[] | LibraryDoc) {
	if (found instanceof Array)
		found = found.map(doc => {
			doc.removeDuplicateCollections();
			return doc;
		});
	else if (found) found.removeDuplicateCollections();
});

librarySchema.post('save', async function () {
	if (this.isNew) await this.initialize();
});

const Library = model<ILibrary, LibraryModel>('Library', librarySchema);
export default Library;
