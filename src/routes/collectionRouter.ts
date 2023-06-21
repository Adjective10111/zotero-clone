import { Router } from 'express';
import CollectionController from '../controllers/CollectionController';
import LibraryController from '../controllers/LibraryController';
import itemRouter from './itemRouter';
import noteRouter from './noteRouter';

const router = Router();
const controller = new CollectionController();

router.use(
	'/:id/items',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	CollectionController.addParentToReq,
	controller.filterBy('parentCollection', ['collection', '_id']),
	controller.useAsParentParam('id'),
	itemRouter
);
router.use(
	'/:id/notes',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	CollectionController.addParentToReq,
	controller.filterBy('parent', ['collection', '_id']),
	controller.useAsParentParam('id'),
	noteRouter
);

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.queuePopulateField.data,
		controller.getOne,
		CollectionController.addParentToReq,
		LibraryController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		CollectionController.addParentToReq,
		LibraryController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		CollectionController.addParentToReq,
		LibraryController.authorizeDelete,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

/* will have req.library and will be checked for view access */
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(
		LibraryController.authorizeView,
		controller.getAll,
		controller.sendResponse('getAll')
	)
	.post(
		controller.addLibraryToBody,
		LibraryController.authorizeAdd,
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create'),
		controller.debugLog
	);

export default router;
