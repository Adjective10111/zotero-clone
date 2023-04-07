import mongoose, { model, Schema } from 'mongoose';
import { type ICollection } from './Collection';
import { type IUser } from './User';

export interface ILibrary {
	user: IUser;

	name: string;
	collections?: ICollection[];
	myPublications: ICollection;
	duplicates: ICollection;
	unfiledItems: ICollection;
	bin: ICollection;
}

const librarySchema = new Schema<ILibrary>({
	user: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
		required: [true, 'hierarchy should be for someone']
	},
	name: {
		type: String,
		required: [true, 'library must have a name']
	},
	myPublications: {
		type: mongoose.Types.ObjectId,
		ref: 'Collection'
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
});

const Library = model<ILibrary>('Library', librarySchema);
export default Library;
