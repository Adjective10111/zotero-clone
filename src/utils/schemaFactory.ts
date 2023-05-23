import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Schema } from 'mongoose';
import validator from 'validator';

//#region user
/**
 * generic user creation
 * keys include:
 * 	 profile, name, email, mobile,
 *	 password, passwordResetToken, passwordResetExpiration, allowedSessionsAfter
 */
export interface genericUser {
	profile?: string;
	name: string;
	email: string;
	password?: string;
	role?: string;

	allowedSessionsAfter: number;
	passwordResetToken: string;
	passwordResetExpiration: Date;
}

export const genericUserSchemaDefinition = {
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
		unique: true,
		default: undefined
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
	allowedSessionsAfter: Number
};

export interface passwordManagementMethods {
	checkPassword: (candidatePass: string) => Promise<boolean>;
	changePassword: (newPass: string) => Promise<void>;
	allowedSession: (timestampInSeconds?: number) => boolean;
	createPasswordResetToken: () => Promise<string>;
	terminateSessions: () => Promise<void>;
}

export const passwordManagement = (schema: Schema): void => {
	/* control password changes */
	schema.pre('save', async function (next) {
		if (!this.isModified('password')) return next();

		this.password = await bcrypt.hash(this.password, 12);
		/* sets the allowedSessions as one second before termination has been done
			and saves it by seconds, NOT milliseconds */
		this.allowedSessionsAfter = Date.now() / 1000 - 1;

		next();
	});

	schema.methods.checkPassword = async function (
		candidatePass: string
	): Promise<boolean> {
		if (!this.password) return false;
		return await bcrypt.compare(candidatePass, this.password);
	};

	schema.methods.changePassword = async function (newPass: string) {
		/* change password */
		this.password = newPass;
		await this.save();
		/* remove password from output */
		this.password = undefined;
	};

	schema.methods.allowedSession = function (
		timestampInSeconds?: number
	): boolean {
		return timestampInSeconds
			? this.allowedSessionsAfter < timestampInSeconds
			: false;
	};

	schema.methods.createPasswordResetToken = async function (): Promise<string> {
		const resetToken = crypto.randomBytes(32).toString('hex');
		this.passwordResetToken = crypto
			.createHash('sha256')
			.update(resetToken)
			.digest('hex');
		this.passwordResetExpiration = Date.now() + 10 * 60 * 1000;

		await this.save({ validateBeforeSave: false });

		return resetToken;
	};

	/**
	 * sets the allowedSessions as termination has been done
	 * and saves it by seconds, NOT milliseconds
	 */
	schema.methods.terminateSessions = async function (): Promise<void> {
		this.allowedSessionsAfter = Date.now() / 1000;
		await this.save();
	};
};
//#endregion

//#region product
/**
 * generic product
 * keys include:
 *		name, cover, category, rating, reviewCount, description,
 *		basePrice, discount, discountExpiration
 */
export interface genericProduct {
	name: string;
	cover: string;
	category: string;
	rating: number;
	reviewCount: number;
	description: string;
	basePrice: number;
	discount: number;
	discountExpiration: Date;
}

export const genericProductSchemaDefinition = {
	name: {
		type: String,
		trim: true,
		required: [true, 'course should have a name']
	},
	cover: {
		type: String,
		required: [true, 'course must be presentable']
	},
	category: {
		type: String,
		trim: true,
		default: 'not-categorized'
	},
	rating: {
		type: Number,
		default: -1
	},
	reviewCount: {
		type: Number,
		default: 0
	},
	description: {
		type: String,
		required: [true, 'needs to be descriptive']
	},
	basePrice: {
		type: Number,
		default: 0,
		min: 0
	},
	discount: {
		type: Number,
		min: 0,
		max: 100,
		default: 0
	},
	discountExpiration: {
		type: Date,
		default: Date.now() - 1
	}
};

/**
 * calculates price based on discount and its expiration
 * calls the priceChange method every time it's got a discount or price change
 * @param {mongoose.Schema} schema
 */
export const discountManagement = (schema: Schema) => {
	schema.post('save', function (doc) {
		if (
			doc.isModified('discount') ||
			doc.isModified('discountExpiration') ||
			doc.isModified('price')
		)
			doc.priceChange();
	});

	schema.pre(/^find/, async function (next) {
		if (!this.get('discountExpiration')) throw new Error('invalid schema');
		if (
			this.get('discountExpiration') < Date.now() &&
			this.get('discount') !== 0
		) {
			this.set('discount', 0);
			await (await this.exec()).save();
		}
		this.set(
			'price',
			this.get('basePrice') * ((100 - this.get('discount')) / 100)
		);

		next();
	});
};
//#endregion
