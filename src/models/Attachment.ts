import { Schema, Types, model, type Model } from 'mongoose';
import { Doc, type ITimestamped } from '../utils/types';
import { ATypeDoc } from './AttachmentType';
import { type ItemDoc } from './Item';

interface IAttachment extends ITimestamped {
	parent: ItemDoc;
	name: string;
	type: ATypeDoc;
	filename: string;
}

interface IAttachmentsMethods {
	populateReference(): Promise<void>;
}
export type AttachmentDoc = Doc<IAttachment, IAttachmentsMethods>;

type AttachmentModel = Model<IAttachment, {}, IAttachmentsMethods>;

const attachmentSchema = new Schema<
	IAttachment,
	AttachmentModel,
	IAttachmentsMethods
>(
	{
		parent: {
			type: Types.ObjectId,
			ref: 'Item',
			required: [true, 'should be attachment']
		},
		name: {
			type: String,
			required: [true, 'should have a name']
		},
		type: {
			type: Types.ObjectId,
			ref: 'AttachmentType',
			required: [true, 'the type should be known']
		},
		filename: {
			type: String,
			required: [true, 'should refer to a file']
		}
	},
	{
		timestamps: true
	}
);

attachmentSchema.index({ parent: 1, name: 1, type: 1 }, { unique: true });

const Attachment = model<IAttachment, AttachmentModel>(
	'Attachment',
	attachmentSchema
);
export default Attachment;
