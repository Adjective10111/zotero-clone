import { Router } from 'express';
import ItemController from '../controllers/ItemController';
import LibraryController from '../controllers/LibraryController';
import attachmentRouter from './attachmentRouter';
import noteRouter from './noteRouter';

const router = Router();
const controller = new ItemController();
router.use(
	'/:id/attachments',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	ItemController.addLibToReq,
	controller.filterBy('parent', ['item', '_id']),
	controller.useAsParentParam('id'),
	attachmentRouter
);
router.use(
	'/:id/notes',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	ItemController.addLibToReq,
	controller.filterBy('parent', ['item', '_id']),
	controller.useAsParentParam('id'),
	noteRouter
);

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.queuePopulateField.data,
		controller.getOne,
		ItemController.addLibToReq,
		LibraryController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		ItemController.addLibToReq,
		LibraryController.authorizeEdit,
		controller.validateBody.patch,
		controller.checkTags,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		ItemController.addLibToReq,
		LibraryController.authorizeDelete,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

/* will have req.collection and will be checked for view access */
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
		controller.addLibraryToBodyFromCollection,
		controller.addCollectionToBody,
		controller.validateBody.create,
		controller.checkTags,
		controller.createOne,
		controller.sendResponse('create')
	);

export default router;
