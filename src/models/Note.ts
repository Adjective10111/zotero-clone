import { model, Schema, Types, type Model } from 'mongoose';
import { type ITimestamped } from '../utils/types';
import { type ICollection } from './Collection';
import { type IItem } from './Item';
import { type ILibrary } from './Library';

type ParentModelName = 'item' | 'collection' | 'library';

export interface INote extends ITimestamped {
	parent: IItem | ICollection | ILibrary;
	parentModel: ParentModelName;

	item?: IItem;
	collection?: ICollection;
	library?: ILibrary;

	text: string;
}

interface INoteMethods {
	populateReference(): Promise<void>;
}

type NoteModel = Model<INote, {}, INoteMethods>;

const noteSchema = new Schema<INote, NoteModel, INoteMethods>(
	{
		parent: {
			type: Types.ObjectId,
			required: [true, 'must belong to a Parent']
		},
		parentModel: {
			type: String,
			required: [true, 'Specify the parent model']
		},
		text: {
			type: String,
			default: ''
		}
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true
		}
	}
);

noteSchema.index({ parent: 1 });

noteSchema.virtual('item', {
	ref: 'Item',
	localField: 'parent',
	foreignField: '_id',
	justOne: true
});

noteSchema.virtual('collection', {
	ref: 'Collection',
	localField: 'parent',
	foreignField: '_id',
	justOne: true
});

noteSchema.virtual('library', {
	ref: 'Library',
	localField: 'parent',
	foreignField: '_id',
	justOne: true
});

noteSchema.methods.populateReference = async function (): Promise<void> {
	await this.populate(this.parentModel);
	this.parent = this[this.parentModel];
};

const Note = model<INote, NoteModel>('Note', noteSchema);
export default Note;
