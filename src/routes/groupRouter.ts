import { Router } from 'express';
import FileController from '../controllers/FileController';
import { GroupController } from '../controllers/GroupController';
import FileManager from '../utils/FileManager';

const router = Router();
const controller = new GroupController();
const fileController = new FileController(
	new FileManager('image', FileManager.createMemoryStorage())
);

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
		fileController.uploadLogo,
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
		controller.validateBody.patch,
		fileController.uploadLogo,
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
