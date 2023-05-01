import { Router } from 'express';
import { LibraryController } from '../controllers/LibraryController';
import collectionRouter from './collectionRouter';

const router = Router();
const controller = new LibraryController();

router.use(
	'/:id/collections',
	controller.getOne,
	controller.filterByLibrary,
	collectionRouter
);

// TODO: complete sync
router.route('/sync').get().post().patch().delete();

router
	.route('/')
	.get(
		controller.filterByOwner,
		controller.getAll,
		controller.sendResponse('getAll')
	)
	.post(
		controller.validateBody.create,
		controller.createOne,
		controller.sendResponse('create')
	);
router
	.route('/:id')
	.get(
		controller.queuePopulateField.collections,
		controller.getOne,
		controller.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.validateBody.patch,
		controller.getOne,
		controller.authorizeEdit,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.collections,
		controller.getOne,
		controller.authorizeOwnership,
		controller.deleteCollections,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

export default router;
