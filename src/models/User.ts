import { Schema, model, type Model } from 'mongoose';
import validator from 'validator';
import {
	genericUser,
	passwordManagement,
	type passwordManagementMethods
} from '../utils/schemaFactory';
import { BlackToken, Doc } from '../utils/types';

interface IUser extends genericUser {
	blackTokens: BlackToken[];
}
interface IUserMethods extends passwordManagementMethods {
	addBlackToken: (
		token: string,
		issuedAt?: number,
		expiration?: number
	) => Promise<void>;
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
		default: [],
		select: false
	}
});

passwordManagement(userSchema);

userSchema.methods.addBlackToken = async function (
	token: string,
	issuedAt?: number,
	expiration?: number
) {
	if (!this.blackTokens) this.blackTokens = [];
	this.blackTokens.push({ token, issuedAt, expiration });
	this.blackTokens.filter((tObj: BlackToken) =>
		!tObj.expiration ? true : tObj.expiration > Date.now()
	);
	await this.save();
};

const User = model<IUser, UserModel>('User', userSchema);
export default User;
