import { NextFunction, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import Group, { GroupDoc, Member } from '../models/Group';
import Controller from '../utils/Controller';
import { createError, wrapAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';
import UserController from './UserController';

export interface IGRequest extends IRequest {
	group?: GroupDoc;
}

export default class GroupController extends Controller<typeof Group> {
	bodyKeys = {
		create: { allowed: ['logo', 'members'], mandatory: ['name', 'owner'] },
		patch: { allowed: ['logo', 'name', 'members', 'newMembers'] }
	};
	validateBody = {
		create: this.preventMaliciousBody(this.bodyKeys.create),
		patch: (req: IGRequest, res: Response, next: NextFunction) => {
			if (req.body.newMembers) {
				if (req.body.members) return next(createError(400, 'invalid body'));
				const members = req.group?.members || [];
				const newMembers = req.body.newMembers.filter(
					(newMem: Member) => !members.some(mem => mem.user === newMem.user)
				);
				if (newMembers.length <= 0)
					return next(createError(400, 'members are not new'));

				req.body.members = [...members, ...newMembers];
				req.body.newMembers = undefined;
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
		if (req.group?.owner.equals(req.user?.id) || req.group?.has(req.user?.id))
			next();
		else next(createError(403, 'unauthorized'));
	}
	authorizeAdd(req: IGRequest, res: Response, next: NextFunction) {
		if (
			req.group?.owner.equals(req.user?.id) ||
			req.group?.canAdd(req.user?.id)
		)
			next();
		else next(createError(403, 'unauthorized'));
	}
	authorizeEdit(req: IGRequest, res: Response, next: NextFunction) {
		if (
			req.group?.owner.equals(req.user?.id) ||
			req.group?.canEdit(req.user?.id)
		)
			next();
		else next(createError(403, 'unauthorized'));
	}
	authorizeDelete(req: IGRequest, res: Response, next: NextFunction) {
		if (
			req.group?.owner.equals(req.user?.id) ||
			req.group?.canDelete(req.user?.id)
		)
			next();
		else next(createError(403, 'unauthorized'));
	}

	filterByMembership(req: IGRequest, res: Response, next: NextFunction) {
		req.defaultFilter = {
			...(req.defaultFilter || {}),
			$or: [
				{ owner: req.user?._id },
				{ members: { $elemMatch: { $eq: req.user?._id } } }
			]
		};

		next();
	}

	addOwner = this.addUserIdToBody('owner');

	@wrapAsync
	async checkMembers(req: IRequest, res: Response, next: NextFunction) {
		const memberArray: any[] = JSON.parse(req.body.members || '[]');

		try {
			req.body.members = await Promise.all(
				memberArray.map(
					async (value: { user: any }): Promise<{ user: Types.ObjectId }> => {
						if (isValidObjectId(value.user)) return value;
						if (typeof value.user === 'string') {
							const user = await UserController.getUser(value.user);
							if (!user) throw createError(400, 'invalid data in array');
							value.user = user.id;
							return value;
						}
						throw createError(400, 'invalid members array');
					}
				)
			);
		} catch (err) {
			return next(err);
		}

		next();
	}
}
