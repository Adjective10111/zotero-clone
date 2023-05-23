import { Schema, Types, model, type Model } from 'mongoose';
import { type Doc, type ITimestamped } from '../utils/types';
import { type AttachmentDoc } from './Attachment';
import { ATypeDoc } from './AttachmentType';
import { type ICollection } from './Collection';
import { type LibraryDoc } from './Library';
import { type INote } from './Note';

interface ITag {
	name: string;
	color: string;
}

export interface IItem extends ITimestamped {
	library: LibraryDoc;
	parentCollection: Doc<ICollection> | Types.ObjectId;

	name: string;
	primaryAttachment?: AttachmentDoc;
	itemType?: ATypeDoc;
	metadata?: object;

	attachments?: AttachmentDoc[];
	notes?: INote[];

	related: ({ name: string; item: IItem } | IItem)[];
	tag: ITag[];
}

interface IItemMethods {
	relate(doc: Doc<IItem> | Types.ObjectId): Promise<void>;
}

type ItemModel = Model<IItem, {}, IItemMethods>;
export type ItemDoc = Doc<IItem, IItemMethods>;

const itemSchema = new Schema<IItem, ItemModel, IItemMethods>(
	{
		library: {
			type: Types.ObjectId,
			ref: 'Library',
			required: [true, 'must belong to a Library']
		},
		parentCollection: {
			type: Types.ObjectId,
			ref: 'Collection'
		},

		name: {
			type: String,
			required: [true, 'must be named']
		},
		primaryAttachment: {
			type: Types.ObjectId,
			ref: 'Attachment'
		},
		itemType: {
			type: Types.ObjectId,
			ref: 'AttachmentType'
		},
		metadata: {
			type: Object,
			default: () => ({})
		},

		related: {
			type: [
				{
					name: String,
					item: { type: Types.ObjectId, ref: 'Item' }
				}
			],
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

itemSchema.index({ parentCollection: 1, name: 1 }, { unique: true });
itemSchema.index({ library: 1, name: 1 });
itemSchema.index({ tag: 1 });

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

	doc.related.push({ name: this.name, item: this._id });
	this.related.push({ name: doc.name, item: doc._id });

	await doc.save();
	await this.save();
};

itemSchema.pre('save', function (next) {
	if (this.modifiedPaths().includes('primaryAttachment'))
		this.itemType = this.primaryAttachment?.type;
	next();
});

const Item = model<IItem, ItemModel>('Item', itemSchema);
export default Item;
