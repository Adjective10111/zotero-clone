import { Schema, Types, model, type Model } from 'mongoose';
import { createError } from '../utils/errorFactory';
import { Doc } from '../utils/types';
import { LibraryDoc } from './Library';
import { UserDoc } from './User';

export interface Member {
	user: UserDoc | Types.ObjectId;
	canAdd: boolean;
	canEdit: boolean;
	canDelete: boolean;
}

interface IGroup {
	logo: string;
	name: string;
	owner: UserDoc;
	members: Member[];

	libraries: LibraryDoc[];
}

interface IGroupMethods {
	getMember(userId: Types.ObjectId): Member | undefined;
	has(userId: Types.ObjectId): boolean;
	canAdd(userId: Types.ObjectId): boolean;
	canEdit(userId: Types.ObjectId): boolean;
	canDelete(userId: Types.ObjectId): boolean;
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
			ref: 'User',
			required: [true, 'a group must have an owner']
		},
		members: {
			type: [
				{
					user: {
						type: Types.ObjectId,
						ref: 'User',
						required: [true, 'member should be a user']
					},
					canAdd: {
						type: Boolean,
						default: true
					},
					canEdit: {
						type: Boolean,
						default: false
					},
					canDelete: {
						type: Boolean,
						default: false
					}
				}
			],
			default: []
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

groupSchema.virtual('libraries', {
	ref: 'Library',
	foreignField: 'group',
	localField: '_id'
});

groupSchema.methods.getMember = function (
	userId: Types.ObjectId
): Member | undefined {
	let member: Member | undefined = undefined;
	if (this.populated('members.user'))
		member = this.members.find((mem: Member) => {
			mem.user.id.equals(userId);
		});
	else
		member = this.members.find((mem: Member) => {
			(mem.user as Types.ObjectId).equals(userId);
		});

	return member;
};

groupSchema.methods.has = function (userId: Types.ObjectId): boolean {
	return !!this.getMember(userId);
};

groupSchema.methods.canAdd = function (userId: Types.ObjectId): boolean {
	const member = this.getMember(userId);
	if (!member) throw createError(404, 'no member found');
	return member.canAdd;
};

groupSchema.methods.canEdit = function (userId: Types.ObjectId): boolean {
	const member = this.getMember(userId);
	if (!member) throw createError(404, 'no member found');
	return member.canEdit;
};

groupSchema.methods.canDelete = function (userId: Types.ObjectId): boolean {
	const member = this.getMember(userId);
	if (!member) throw createError(404, 'no member found');
	return member.canDelete;
};

const Group = model<IGroup, GroupModel>('Group', groupSchema);
export default Group;
