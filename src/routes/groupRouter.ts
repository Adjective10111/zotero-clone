import { NextFunction, Response, Router } from 'express';
import { GroupController, IGRequest } from '../controllers/GroupController';

const router = Router();
const controller = new GroupController();

router
	.route('/')
	.get(
		controller.filterByMembership,
		controller.getAll,
		controller.sendResponse('getAll')
	)
	.post(
		controller.addOwner,
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
router
	.route('/:id')
	.get(
		controller.addLibraryPopulateArray,
		controller.getOne,
		controller.authorizeMembership,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.getOne,
		controller.authorizeOwnership,
		controller.validateBody.patch,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.getOne,
		controller.authorizeOwnership,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

export default router;
