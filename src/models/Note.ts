import { Schema, Types, model, type Model } from 'mongoose';
import { Doc, type ITimestamped } from '../utils/types';
import { CollectionDoc } from './Collection';
import { ItemDoc } from './Item';

type ParentModelName = 'parentItem' | 'parentCollection';

export interface INote extends ITimestamped {
	parent: ItemDoc | CollectionDoc;
	parentModel: ParentModelName;

	parentItem?: ItemDoc;
	parentCollection?: CollectionDoc;

	text: string;
}

interface INoteMethods {
	populateReference(): Promise<void>;
}

type NoteModel = Model<INote, {}, INoteMethods>;
export type NoteDoc = Doc<INote, INoteMethods>;

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
		},
		versionKey: false
	}
);

noteSchema.index({ parent: 1 });

noteSchema.virtual('parentItem', {
	ref: 'Item',
	localField: 'parent',
	foreignField: '_id',
	justOne: true
});

noteSchema.virtual('parentCollection', {
	ref: 'Collection',
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
