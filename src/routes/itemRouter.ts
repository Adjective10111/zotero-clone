import { Router } from 'express';
import CollectionController from '../controllers/CollectionController';
import ItemController from '../controllers/ItemController';
import attachmentRouter from './attachmentRouter';

const router = Router();
const controller = new ItemController();
router.use(
	'/:id/attachments',
	controller.queuePopulateField.parent,
	controller.getOne,
	controller.removePopulateArray,
	ItemController.authorizeView,
	controller.useAsParentParam('id'),
	attachmentRouter
);

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.queuePopulateField.data,
		controller.getOne,
		ItemController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		ItemController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		ItemController.authorizeEdit,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

// will have req.collection and will be checked for view access
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		CollectionController.authorizeEdit,
		controller.addLibraryToBodyFromCollection,
		controller.addCollectionToBody,
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);

export default router;
