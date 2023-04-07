import { model, Schema, Types } from "mongoose";
import { ICollection } from "./Collection";
import { IItem } from "./Item";
import { ILibrary } from "./Library";

export interface INote {
	reference: IItem | ILibrary | ICollection;
	text: string;
}

export interface IWebsite {
	reference: IItem,
	html?: string,
	url?: string
}

export type IAttachments = INote | IWebsite;

const attachmentSchema = new Schema<IAttachments>({
	reference: {
		type: Types.ObjectId,
		required: [true, 'should be attachment']
	},
	// note
	text: String,
	// website
	html: String,
	url: String,
}, {
	toJSON: {
		virtuals: true
	}
});

attachmentSchema.virtual('item', {
	ref: 'Item',
	localField: 'reference',
	foreignField: '_id',
	justOne: true
});

attachmentSchema.virtual('collection', {
	ref: 'Collection',
	localField: 'reference',
	foreignField: '_id',
	justOne: true
});

attachmentSchema.virtual('library', {
	ref: 'Library',
	localField: 'reference',
	foreignField: '_id',
	justOne: true
});

// const Attachment = model<IAttachments>('Attachment', attachmentSchema);
// export default Attachment;
