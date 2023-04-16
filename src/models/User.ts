import { model, Schema, type Model } from 'mongoose';
import validator from 'validator';
import {
	genericUser,
	passwordManagement,
	type passwordManagementMethods
} from '../utils/schemaFactory';

export interface IUser extends genericUser {}
export interface IUserMethods extends passwordManagementMethods {}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
	photo: {
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
	mobile: {
		type: String,
		match: /\d{11}/,
		unique: true
	},
	password: {
		type: String,
		required: [true, 'please specify a password'],
		minlength: 8,
		select: false
	},
	allowedSessionsAfter: Number,
	passwordResetToken: String,
	passwordResetExpiration: Date
});

passwordManagement(userSchema);

const User = model<IUser, UserModel>('User', userSchema);
export default User;
