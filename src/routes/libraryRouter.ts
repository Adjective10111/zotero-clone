import { Router } from 'express';
import LibraryController from '../controllers/LibraryController';
import UserController from '../controllers/UserController';
import collectionRouter from './collectionRouter';

const router = Router();
const controller = new LibraryController();

router.get(
	'/public',
	controller.filterByPublicity,
	controller.getAll,
	controller.sendResponse('getAll')
);

router.use(UserController.authenticate);

router.use(
	'/:id/collections',
	controller.getOne,
	controller.filterByLibrary,
	controller.useAsParentParam('id'),
	collectionRouter
);

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
		controller.initializeLibrary,
		controller.sendResponse('create')
	);
router
	.route('/:id')
	.get(
		controller.queuePopulateField.collections,
		controller.getOne,
		LibraryController.authorizeView,
		controller.sendResponse('getOne')
	)
	.patch(
		controller.validateBody.patch,
		controller.getOne,
		LibraryController.authorizeEdit,
		controller.patchDocument,
		controller.sendResponse('patch')
	)
	.delete(
		controller.queuePopulateField.collections,
		controller.getOne,
		LibraryController.authorizeDelete,
		controller.deleteCollections,
		controller.deleteDocument,
		controller.sendResponse('delete')
	);

export default router;
