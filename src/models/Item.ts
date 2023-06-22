import { Schema, Types, model, type Model } from 'mongoose';
import { type Doc, type ITimestamped } from '../utils/types';
import { type AttachmentDoc } from './Attachment';
import { ATypeDoc } from './AttachmentType';
import { type ICollection } from './Collection';
import { type LibraryDoc } from './Library';
import { type INote } from './Note';
import Tag, { TagDoc } from './Tag';

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
	tags: TagDoc[];
}

type AggregateFilter = {
	$match: object;
};

interface IItemMethods {
	relate(doc: Doc<IItem> | Types.ObjectId): Promise<void>;
}

interface ItemModel extends Model<IItem, {}, IItemMethods> {
	searchTag(
		tag: Types.ObjectId | string,
		filter: AggregateFilter
	): Promise<Doc<IItem>[]>;
}
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
		tags: {
			type: [
				{
					type: Types.ObjectId,
					ref: Tag
				}
			],
			default: []
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

itemSchema.index({ parentCollection: 1, name: 1 }, { unique: true });
itemSchema.index({ library: 1, name: 1 });
itemSchema.index({ tags: 1 });

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
itemSchema.statics.searchTag = async function (
	tag: Types.ObjectId | string,
	filter: AggregateFilter
): Promise<Doc<IItem>[]> {
	return await Item.aggregate([
		filter,
		{
			$unwind: '$tags'
		},
		{
			$match: { tags: tag }
		}
	]).exec();
};

itemSchema.pre('save', function (next) {
	if (this.modifiedPaths().includes('primaryAttachment'))
		this.itemType = this.primaryAttachment?.type;
	next();
});

const Item = model<IItem, ItemModel>('Item', itemSchema);
export default Item;
