import { Router } from 'express';
import AttachmentController from '../controllers/AttachmentController';
import FileController from '../controllers/FileController';
import ItemController from '../controllers/ItemController';

const router = Router();
const controller = new AttachmentController();
const fileController = FileController.createFileController();

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchById,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.authorizeEdit,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

/* will have req.item and will be checked for view access */
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		ItemController.authorizeEdit,
		fileController.uploadFile,
		fileController.addFileName('filename'),
		controller.addItemToBody,
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
export default router;
