import { Schema, Types, model, type Model } from "mongoose";
import { type ITimestampedSchema } from '../utils/schemaFactory';
import { type IItem } from "./Item";

export interface IWebsite {
	html?: string;
	url?: string;
}

export interface IFile {
	filename: string;
	pages?: number
}

type AttachmentTypes = ITimestampedSchema & IWebsite & IFile;

export interface IAttachment extends AttachmentTypes {
	parent: IItem;
}

interface IAttachmentsMethods {
	populateReference(): Promise<void>;
}

type AttachmentModel = Model<IAttachment, {}, IAttachmentsMethods>;

const attachmentSchema = new Schema<IAttachment, AttachmentModel, IAttachmentsMethods>({
	parent: {
		type: Types.ObjectId,
		required: [true, 'should be attachment']
	},
	// website
	html: String,
	url: String,
	// file
	filename: String,
	pages: Number
}, {
	timestamps: true
});

const Attachment = model<IAttachment, AttachmentModel>('Attachment', attachmentSchema);
export default Attachment;
