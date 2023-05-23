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
	CollectionController.authorizeView,
	controller.filterBy('parentCollection', ['collection', '_id']),
	controller.useAsParentParam('id'),
	itemRouter
);
router.use(
	'/:id/notes',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	CollectionController.authorizeView,
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
		CollectionController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		CollectionController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		CollectionController.authorizeEdit,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

// will have req.library and will be checked for view access
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		controller.addLibraryToBody,
		LibraryController.authorizeEdit,
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create'),
		controller.debugLog
	);

export default router;
