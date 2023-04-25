import { Router } from 'express';
import UserController from '../controllers/UserController';
import attachmentRouter from './attachmentRouter';
import collectionRouter from './collectionRouter';
import itemRouter from './itemRouter';
import libraryRouter from './libraryRouter';
import noteRouter from './noteRouter';
import userRouter from './userRouter';

const router = Router();

router.use('/users', userRouter);

router.use(UserController.authenticate);
router.use('/libraries', libraryRouter);
router.use('/collections', collectionRouter);
router.use('/items', itemRouter);
router.use('/attachments', attachmentRouter);
router.use('/notes', noteRouter);

export default router;
