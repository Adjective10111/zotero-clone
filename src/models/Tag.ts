import { Schema, Types, model, type Model } from 'mongoose';
import { Doc, type ITimestamped } from '../utils/types';
import { ItemDoc } from './Item';

export interface ITag extends ITimestamped {
	item: ItemDoc | Types.ObjectId;

	name: string;
	color: string;
}

interface ITagMethods {}

type TagModel = Model<ITag, {}, ITagMethods>;
export type TagDoc = Doc<ITag, ITagMethods>;

const tagSchema = new Schema<ITag, TagModel, ITagMethods>(
	{
		item: {
			type: Types.ObjectId,
			required: true,
			ref: 'Item'
		},

		name: {
			type: String,
			required: true
		},
		color: {
			type: String,
			default: '#00A9B7'
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

tagSchema.index({ item: 1, name: 1 }, { unique: true });
tagSchema.index({ name: 1, item: 1 });

const Tag = model<ITag, TagModel>('Tag', tagSchema);
export default Tag;
