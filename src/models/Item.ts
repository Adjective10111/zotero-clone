import mongoose, { model, Schema } from "mongoose";
import { IAttachments } from "./Attachment";
import { ICollection } from "./Collection";
import { IFile } from "./FileMetadata";
import { ILibrary } from "./Library";

export interface IItem {
	name: string;
	files?: IFile[];
	attachments?: IAttachments[];
	parent: ILibrary | ICollection;
}

const itemSchema = new Schema<IItem>({
	name: {
		type: String,
		required: [true, 'must be named']
	},
	parent: {
		type: mongoose.Types.ObjectId,
		required: [true, 'must belong to a Library or Collection']
	}
}, {
	toJSON: {
		virtuals: true
	}
});

itemSchema.virtual('library', {
    ref: 'Library',
    localField: 'parent',
    foreignField: '_id',
    justOne: true
});

itemSchema.virtual('collection', {
    ref: 'Collection',
    localField: 'parent',
    foreignField: '_id',
    justOne: true
});

itemSchema.pre(/^find/, function(next) {
	this.populate('library').populate('collection');
	next();
});

const Item = model<IItem>('Item', itemSchema);
export default Item;
