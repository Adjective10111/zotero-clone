import { Router } from 'express';
import { CollectionController } from '../controllers/CollectionController';
import { ItemController } from '../controllers/ItemController';
import { LibraryController } from '../controllers/LibraryController';

const router = Router();
const controller = new ItemController();
// router.get('/:id/metadata');

router
	.route('/:id')
	.get(
		controller.queuePopulateField.parent,
		controller.queuePopulateField.data,
		controller.getOne,
		controller.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.queuePopulateField.parent,
		controller.getOne,
		controller.authorizeEdit,
		controller.validateBody.patch,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.parent,
		controller.getOne,
		controller.authorizeEdit,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

// will have req.library and will be checked for view access
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		controller.condition({
			if: [controller.isParentLibrary],
			then: [
				LibraryController.authorizeEdit,
				controller.addLibraryToBodyFromReq,
				controller.addDefaultCollectionToBody
			],
			else: [
				CollectionController.authorizeEdit,
				controller.addLibraryToBodyFromCollection,
				controller.addCollectionToBody
			]
		}),
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);

export default router;
