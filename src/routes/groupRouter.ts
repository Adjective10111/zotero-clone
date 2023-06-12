import { Router } from 'express';
import FileController from '../controllers/FileController';
import GroupController from '../controllers/GroupController';
import UserController from '../controllers/UserController';

const router = Router();
const controller = new GroupController();
const fileController = FileController.createImageController();

router.get(
	'/public',
	controller.getAll,
	controller.sendResponse('getAll')
);

router.use(UserController.authenticate);

router
	.route('/')
	.get(
		controller.filterByMembership,
		controller.getAll,
		controller.sendResponse('getAll')
	)
	.post(
		fileController.uploadLogo,
		controller.addOwner,
		controller.validateBody.create,
		fileController.resizeLogo,
		fileController.addFilePath('logo'),
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
		fileController.uploadLogo,
		controller.validateBody.patch,
		fileController.resizeLogo,
		fileController.addFilePath('logo'),
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
