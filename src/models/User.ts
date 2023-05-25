import { Schema, model, type Model } from 'mongoose';
import validator from 'validator';
import {
	genericUser,
	passwordManagement,
	type passwordManagementMethods
} from '../utils/schemaFactory';
import { Doc } from '../utils/types';

interface BlackToken {
	token: string;
	expiration?: number;
}

interface IUser extends genericUser {
	blackTokens: BlackToken[];
}
interface IUserMethods extends passwordManagementMethods {
	addBlackToken: (token: string, expiration?: number) => Promise<void>;
}
export type UserDoc = Doc<IUser, IUserMethods>;

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
	profile: {
		type: String
	},
	name: {
		type: String,
		required: [true, 'user must have a name']
	},
	email: {
		type: String,
		lowercase: true,
		unique: true,
		required: [true, 'user must have an email'],
		validate: [validator.isEmail, 'Please provide a valid email']
	},
	password: {
		type: String,
		required: [true, 'please specify a password'],
		minlength: 8,
		select: false
	},
	role: {
		type: String,
		default: 'user'
	},

	passwordResetToken: {
		type: String,
		select: false
	},
	passwordResetExpiration: {
		type: Date,
		select: false
	},
	allowedSessionsAfter: Number,
	blackTokens: {
		type: [Object],
		default: []
	}
});

passwordManagement(userSchema);

userSchema.methods.addBlackToken = async function (
	token: string,
	expiration?: number
) {
	this.blackTokens.push({ token, expiration });
	this.blackTokens.filter((tObj: BlackToken) =>
		!tObj.expiration ? true : tObj.expiration > Date.now()
	);
	await this.save();
};

const User = model<IUser, UserModel>('User', userSchema);
export default User;
