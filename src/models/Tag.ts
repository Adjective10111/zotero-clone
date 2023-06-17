import { Schema, Types, model, type Model } from 'mongoose';
import { Doc, type ITimestamped } from '../utils/types';
import { ItemDoc } from './Item';

export interface ITag extends ITimestamped {
	parent: ItemDoc;
	items: ItemDoc[];

	name: string;
	color: string;
}

interface ITagMethods {}

type TagModel = Model<ITag, {}, ITagMethods>;
export type TagDoc = Doc<ITag, ITagMethods>;

const tagSchema = new Schema<ITag, TagModel, ITagMethods>(
	{
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

tagSchema.index({ name: 1 });

const Tag = model<ITag, TagModel>('Tag', tagSchema);
export default Tag;
