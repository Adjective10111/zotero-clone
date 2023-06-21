import { NextFunction, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import Group, { GroupDoc } from '../models/Group';
import { LibraryDoc } from '../models/Library';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';
import UserController from './UserController';

export interface IGRequest extends IRequest {
	group?: GroupDoc;
}

export default class GroupController extends Controller<typeof Group> {
	bodyKeys = {
		create: { allowed: ['logo', 'editors'], mandatory: ['name', 'owner'] },
		patch: { allowed: ['logo', 'name', 'editors', 'newEditors'] }
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: (req: IGRequest, res: Response, next: NextFunction) => {
			if (req.body.newEditors) {
				if (req.body.editors) return next(createError(400, 'invalid body'));
				const editors = req.group?.editors || [];
				const newEditors = req.body.newEditors.filter(
					(id: Types.ObjectId) => !(editors as Types.ObjectId[]).includes(id)
				);
				if (newEditors.length <= 0)
					return next(createError(400, 'editors are not new'));

				req.body.editors = [...editors, ...newEditors];
				req.body.newEditors = undefined;
			}

			this.preventMaliciousBody(this.bodyKeys.patch)(req, res, err => {
				if (err) next(err);
				else next();
			});
		}
	};

	populateOptions = {
		owner: {
			path: 'owner'
		},
		libraries: {
			path: 'libraries'
		}
	};
	queuePopulateField = {
		owner: this.createPopulateArray(this.populateOptions.owner),
		libraries: this.createPopulateArray(this.populateOptions.libraries)
	};

	constructor() {
		super(Group);
	}

	authorizeOwnership = super.authorizeOwnershipFactory(this.modelName, 'owner');
	authorizeMembership(req: IGRequest, res: Response, next: NextFunction) {
		if (
			req.group?.owner.equals(req.user?.id) ||
			(req.group?.editors as Types.ObjectId[]).some((userId: Types.ObjectId) =>
				userId.equals(req.user?.id)
			)
		)
			next();
		else next(createError(403, 'unauthorized'));
	}
	@wrapAsync
	async filterViewable(req: IGRequest, res: Response, next: NextFunction) {
		if (!req.group) return next(createError(400, 'no group'));
		req.group.libraries = await req.group.libraries.filter(
			async (lib: LibraryDoc) => await lib.canView(req.user?.id)
		);
		next();
	}

	filterByMembership(req: IGRequest, res: Response, next: NextFunction) {
		req.defaultFilter = {
			...(req.defaultFilter || {}),
			$or: [
				{ owner: req.user?._id },
				{ editors: { $elemMatch: { $eq: req.user?._id } } }
			]
		};

		next();
	}

	addOwner = this.addUserIdToBody('owner');

	@wrapAsync
	async checkEditors(req: IRequest, res: Response, next: NextFunction) {
		const tags: any[] = req.body.editors || req.body.newEditors;
		tags.map(async (value: any): Promise<Types.ObjectId> => {
			if (isValidObjectId(value)) return value;
			if (typeof value === 'string') {
				const user = await UserController.getUser(value);
				if (!user) throw createError(400, 'invalid data in array');
				return user.id;
			}
			throw createError(400, 'invalid editors array');
		});

		next();
	}
}
