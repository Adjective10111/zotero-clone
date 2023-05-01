import { Schema, Types, model, type Model } from 'mongoose';
import { Doc } from '../utils/types';
import { LibraryDoc } from './Library';
import { UserDoc } from './User';

interface IGroup {
	logo: string;
	name: string;
	owner: UserDoc;
	editors: UserDoc[] | Types.ObjectId[];

	libraries: LibraryDoc[];
}

interface IGroupMethods {
	has(this: Doc<IGroup>, userId: Types.ObjectId): boolean;
}

export type GroupDoc = Doc<IGroup, IGroupMethods>;
type GroupModel = Model<IGroup, {}, IGroupMethods>;

const groupSchema = new Schema<IGroup, GroupModel, IGroupMethods>(
	{
		logo: {
			type: String,
			default: 'public/icons/group.png'
		},
		name: {
			type: String,
			required: [true, 'should be named'],
			unique: true
		},
		owner: {
			type: Types.ObjectId,
			required: [true, 'a group must have an owner']
		},
		editors: {
			type: [{ type: Types.ObjectId, ref: 'User' }],
			default: []
		}
	},
	{
		toJSON: {
			virtuals: true
		}
	}
);

groupSchema.virtual('libraries', {
	ref: 'Library',
	foreignField: 'group',
	localField: '_id'
});

groupSchema.methods.has = function (userId: Types.ObjectId): boolean {
	if (this.populated('editors'))
		return (this.editors as UserDoc[]).some((user: UserDoc) => {
			user.id.equals(userId);
		});
	else
		return (this.editors as Types.ObjectId[]).some((id: Types.ObjectId) => {
			id.equals(userId);
		});
};

const Group = model<IGroup, GroupModel>('Group', groupSchema);
export default Group;
