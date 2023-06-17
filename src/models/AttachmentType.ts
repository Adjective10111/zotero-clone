import { Schema, model } from 'mongoose';
import { Doc } from '../utils/types';

interface IAType {
	icon: string;
	name: string;
	api?: string;
	metadataKeys?: string[];
}

export type ATypeDoc = Doc<IAType>;

const aTypeSchema = new Schema<IAType>(
	{
		icon: {
			type: String,
			default: 'icons/type.png'
		},
		name: {
			type: String,
			required: [true, 'should be named'],
			unique: true
		},
		api: {
			type: String,
			unique: true
		},
		metadataKeys: {
			type: [String]
		}
	},
	{
		versionKey: false
	}
);

const AttachmentType = model<IAType>('AttachmentType', aTypeSchema);
export default AttachmentType;
