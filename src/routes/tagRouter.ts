import { Router } from 'express';
import TagController from '../controllers/TagController';

const router = Router();
const controller = new TagController();

router.get(
	'/',
	controller.filterByUser,
	controller.getAll,
	controller.sendResponse('getAll')
);
router.get(
	'/library/:id',
	controller.getTagsByParentId('library'),
	controller.sendResponse('getAll')
);
router.get(
	'/collection/:id',
	controller.getTagsByParentId('parentCollection'),
	controller.sendResponse('getAll')
);

export default router;
