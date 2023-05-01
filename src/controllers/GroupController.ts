import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import Group, { GroupDoc } from '../models/Group';
import { LibraryDoc } from '../models/Library';
import Controller from '../utils/Controller';
import { isEmpty } from '../utils/basicFunctions';
import { createError } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export interface IGRequest extends IRequest {
	group?: GroupDoc;
}

export class GroupController extends Controller<typeof Group> {
	bodyKeys = {
		create: { allowed: ['logo', 'editors'], mandatory: ['name', 'owner'] },
		patch: { allowed: ['name', 'editors', 'newEditors'] }
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

			this.preventMaliciousBody(this.bodyKeys.patch)(req, res, next);
			next();
		}
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

	addLibraryPopulateArray = this.createPopulateArray({ path: 'libraries' });

	addOwner = this.addUserIdToBody('owner');
}
