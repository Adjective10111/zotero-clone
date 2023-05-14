import { Router } from 'express';
import AttachmentTypeController from '../controllers/AttachmentTypeController';
import FileController from '../controllers/FileController';

const router = Router();
const controller = new AttachmentTypeController();
const fileController = FileController.createImageController();

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		fileController.uploadIcon,
		controller.parseMetadataKeys,
		controller.validateBody.create,
		fileController.resizeIcon,
		fileController.addFilePath('icon'),
		controller.createOne,
		controller.sendResponse('create')
	);
router
	.route('/:id')
	.get(controller.getOne, controller.sendResponse('getOne'))
	.patch(
		fileController.uploadIcon,
		controller.parseMetadataKeys,
		controller.validateBody.patch,
		fileController.resizeIcon,
		fileController.addFilePath('icon'),
		controller.patchById,
		controller.sendResponse('patch')
	)
	.delete(controller.deleteById, controller.sendResponse('delete'));

export default router;
