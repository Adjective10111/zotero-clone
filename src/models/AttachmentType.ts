import { Schema, Types, model, type Model } from 'mongoose';

interface IAType {
	icon: string;
	name: string;
	api?: string;
	metadataKeys?: string[];
}

const aTypeSchema = new Schema<IAType>({
	icon: {
		type: String,
		default: 'public/icons/type.png'
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
});

const AttachmentType = model<IAType>('AttachmentType', aTypeSchema);
export default AttachmentType;