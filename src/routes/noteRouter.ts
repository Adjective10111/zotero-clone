import { Router } from 'express';
import LibraryController from '../controllers/LibraryController';
import NoteController from '../controllers/NoteController';

const router = Router();
const controller = new NoteController();

router
	.route('/:id')
	.get(
		controller.getOne,
		controller.populateParent,
		NoteController.addLibToReq,
		LibraryController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.getOne,
		controller.populateParent,
		NoteController.addLibToReq,
		LibraryController.authorizeEdit,
		controller.validateBody.patch,
		controller.patchById,
		controller.sendResponse('patch')
	)
	.delete(
		controller.getOne,
		controller.populateParent,
		NoteController.addLibToReq,
		LibraryController.authorizeDelete,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

/* will have req.item or req.collection and will be checked for view access */
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
		controller.condition({
			if: [controller.isParentCollections],
			then: [controller.addCollectionToBody],
			else: [controller.addItemToBody]
		}),
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
export default router;
