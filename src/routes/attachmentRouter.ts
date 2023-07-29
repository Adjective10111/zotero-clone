import { Router } from 'express';
import AttachmentController from '../controllers/AttachmentController';
import FileController from '../controllers/FileController';
import ItemController from '../controllers/ItemController';
import LibraryController from '../controllers/LibraryController';

const router = Router();
const controller = new AttachmentController();
const fileController = FileController.createFileController();

router.get(
	'/:id/file',
	controller.queuePopulateField.parent,
	controller.getOne,
	AttachmentController.addLibToReq,
	LibraryController.authorizeView,
	controller.addFileInfoToReq,
	fileController.downloadFile
);

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.addLibToReq,
		LibraryController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.addLibToReq,
		LibraryController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchById,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		AttachmentController.addLibToReq,
		LibraryController.authorizeDelete,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

/* will have req.item and will be checked for view access */
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(
		LibraryController.authorizeView,
		controller.getAll,
		controller.sendResponse('getAll')
	)
	.post(
		LibraryController.authorizeAdd,
		controller.addItemToBody,
		fileController.uploadFile,
		fileController.addFileName('filename'),
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
export default router;
