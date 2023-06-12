import { Router } from 'express';
import TagController from '../controllers/TagController';

const router = Router();
const controller = new TagController();

router.get('/', controller.getAll, controller.sendResponse('getAll'));
export default router;
