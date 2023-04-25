import { model, Schema, Types, type Model } from 'mongoose';
import { type ITimestamped } from '../utils/types';
import { type IItem } from './Item';

interface IAttachment {
	parent: IItem;
}

export interface IWebsite extends IAttachment {
	type: 'website';
	html?: string;
	url?: string;
}

export interface IFile extends IAttachment {
	type: 'file';
	filename: string;
	pages?: number;
}

export type AnyAttachment = ITimestamped & (IWebsite | IFile);

interface IAttachmentsMethods {
	populateReference(): Promise<void>;
}

type AttachmentModel = Model<AnyAttachment, {}, IAttachmentsMethods>;

const attachmentSchema = new Schema<
	AnyAttachment,
	AttachmentModel,
	IAttachmentsMethods
>(
	{
		parent: {
			type: Types.ObjectId,
			required: [true, 'should be attachment']
		},
		type: {
			type: String,
			required: [true, 'the type should be known']
		},
		// website
		html: String,
		url: String,
		// file
		filename: String,
		pages: Number
	},
	{
		timestamps: true
	}
);

attachmentSchema.index({ parent: 1 });

const Attachment = model<AnyAttachment, AttachmentModel>(
	'Attachment',
	attachmentSchema
);
export default Attachment;
