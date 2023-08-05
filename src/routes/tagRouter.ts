import { Router } from 'express';
import CollectionController from '../controllers/CollectionController';
import ItemController from '../controllers/ItemController';
import LibraryController from '../controllers/LibraryController';
import TagController from '../controllers/TagController';

const router = Router();
const controller = new TagController();

const libraryController = new LibraryController();
const collectionController = new CollectionController();
const itemController = new ItemController();

// fetching tags of
router.get(
	'/',
	controller.getTagsOfItemsOfUser,
	controller.sendResponse('getAll')
);
router.get(
	'/library/:id',
	libraryController.getOne,
	LibraryController.authorizeView,
	controller.getTagsOfItemsOfLibrary,
	controller.sendResponse('getAll')
);
router.get(
	'/collection/:id',
	collectionController.getOne,
	CollectionController.addLibToReq,
	LibraryController.authorizeView,
	controller.getTagsOfItemsOfCollection,
	controller.sendResponse('getAll')
);
router.get(
	'/item/:id',
	itemController.getOne,
	ItemController.addLibToReq,
	LibraryController.authorizeView,
	controller.getTagsOfItem,
	controller.sendResponse('getAll')
);

// searching by tags
router.get(
	'/libraries',
	controller.getLibrariesByTags,
	libraryController.sendResponse('getAll')
);
router.get(
	'/collections',
	controller.getCollectionsByTags,
	collectionController.sendResponse('getAll')
);
router.get(
	'/items',
	controller.getItemsByTags,
	itemController.sendResponse('getAll')
);

// deletion
router.delete(
	'/:id',
	controller.populateItem,
	controller.getOne,
	ItemController.addLibToReq,
	LibraryController.authorizeEdit,
	controller.deleteById,
	controller.sendResponse('delete')
);

export default router;
