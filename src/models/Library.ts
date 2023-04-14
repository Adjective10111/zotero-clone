import mongoose, { model, Schema } from 'mongoose';
import { type ICollection } from './Collection';
import { type IUser } from './User';

export interface ILibrary {
	user: IUser;

	name: string;
	collections?: ICollection[];
	duplicates: ICollection;
	unfiledItems: ICollection;
	bin: ICollection;
}

const librarySchema = new Schema<ILibrary>(
	{
		user: {
			type: mongoose.Types.ObjectId,
			ref: 'User',
			required: [true, 'library should be for someone']
		},
		name: {
			type: String,
			required: [true, 'library must have a name']
		},

		duplicates: {
			type: mongoose.Types.ObjectId,
			ref: 'Collection'
		},
		unfiledItems: {
			type: mongoose.Types.ObjectId,
			ref: 'Collection'
		},
		bin: {
			type: mongoose.Types.ObjectId,
			ref: 'Collection'
		}
	},
	{
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

const Library = model<ILibrary>('Library', librarySchema);
export default Library;
