import { Router } from 'express';
import CollectionController from '../controllers/CollectionController';
import FileController from '../controllers/FileController';
import ItemController from '../controllers/ItemController';
import NoteController from '../controllers/NoteController';

const router = Router();
const controller = new NoteController();

router
	.route('/:id')
	.get(
		controller.getOne,
		controller.populateParent,
		NoteController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.getOne,
		controller.populateParent,
		NoteController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchById,
		controller.sendResponse('patch')
	)
	.delete(
		controller.getOne,
		controller.populateParent,
		NoteController.authorizeEdit,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

// will have req.item or req.collection and will be checked for view access
router.use(controller.allowChildRouter);

router
	.route('/')
	.get(controller.getAll, controller.sendResponse('getAll'))
	.post(
		controller.condition({
			if: [controller.isParentCollections],
			then: [
				CollectionController.authorizeEdit,
				controller.addCollectionToBody
			],
			else: [ItemController.authorizeEdit, controller.addItemToBody]
		}),
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
export default router;
