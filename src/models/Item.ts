import mongoose, { Schema, Types, model, type Model } from "mongoose";
import { type ITimestampedSchema } from "../utils/schemaFactory";
import { type IAttachment } from "./Attachment";
import { type ICollection } from "./Collection";
import { type INote } from "./Note";

export interface IItem extends ITimestampedSchema {
	parent: ICollection;
	
	name: string;
	itemType: string;
	metadata?: object;

	attachments?: IAttachment[];
	notes?: INote[]
}

type ItemModel = Model<IItem>;

const itemSchema = new Schema<IItem, ItemModel>({
	parent: {
		type: mongoose.Types.ObjectId,
		ref: 'Collection',
		required: [true, 'must belong to a Collection']
	},
	name: {
		type: String,
		required: [true, 'must be named']
	},
	itemType: {
		type: String,
		default: 'unknown'
	},
	metadata: {
		type: Object,
		default: () => ({})
	}
}, {
	timestamps: true,
	toJSON: {
		virtuals: true
	}
});

itemSchema.virtual('attachments', {
	ref: 'Attachment',
	foreignField: 'parent',
	localField: '_id'
});

itemSchema.virtual('notes', {
	ref: 'Note',
	foreignField: 'parent',
	localField: '_id'
});

const Item = model<IItem, ItemModel>('Item', itemSchema);
export default Item;
