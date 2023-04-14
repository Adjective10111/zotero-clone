import mongoose, { Schema, Types, model, type Model } from 'mongoose';
import { createError } from '../utils/errorFactory';
import { type Doc, type ITimestampedSchema } from '../utils/schemaFactory';
import { type IAttachment } from './Attachment';
import { type ICollection } from './Collection';
import { type INote } from './Note';

interface ITag {
	name: string;
	color: string;
}

export interface IItem extends ITimestampedSchema {
	parent: ICollection;

	name: string;
	primaryAttachment: IAttachment;
	itemType: string;
	metadata?: object;

	attachments?: IAttachment[];
	notes?: INote[];

	related: { name: string; id: Types.ObjectId }[];
	tag: ITag[];
}

interface IItemMethods {
	relate(doc: Doc<IItem> | Types.ObjectId): Promise<void>;
}

type ItemModel = Model<IItem, {}, IItemMethods>;

const itemSchema = new Schema<IItem, ItemModel, IItemMethods>(
	{
		parent: {
			type: mongoose.Types.ObjectId,
			ref: 'Collection',
			required: [true, 'must belong to a Collection']
		},
		name: {
			type: String,
			required: [true, 'must be named']
		},
		primaryAttachment: {
			type: Types.ObjectId,
			ref: 'Attachment',
			required: [true, "must represent an attachment's metadata"]
		},
		itemType: {
			type: String,
			default: 'unknown'
		},
		metadata: {
			type: Object,
			default: () => ({})
		},

		related: {
			type: [{ name: String, id: Types.ObjectId }],
			ref: 'Item',
			default: []
		},
		tag: {
			type: [
				{
					name: String,
					color: String
				}
			],
			default: []
		}
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true
		}
	}
);

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

itemSchema.methods.relate = async function (
	doc: Doc<IItem> | Types.ObjectId
): Promise<void> {
	if (doc instanceof Types.ObjectId) {
		const temp = await Item.findById(doc);
		if (!temp) throw new Error('document not found');
		doc = temp;
	}

	doc.related.push({ name: this.name, id: this._id });
	this.related.push({ name: doc.name, id: doc._id });

	await doc.save();
	await this.save();
};

const Item = model<IItem, ItemModel>('Item', itemSchema);
export default Item;
