import { Router } from 'express';
import UserController from '../controllers/UserController';
import attachmentRouter from './attachmentRouter';
import attachmentTypeRouter from './attachmentTypeRouter';
import collectionRouter from './collectionRouter';
import groupRouter from './groupRouter';
import itemRouter from './itemRouter';
import libraryRouter from './libraryRouter';
import noteRouter from './noteRouter';
import tagRouter from './tagRouter';
import userRouter from './userRouter';

const router = Router();

router.use('/users', userRouter);

router.use('/groups', groupRouter);
router.use('/libraries', libraryRouter);

router.use(UserController.authenticate);
router.use('/collections', collectionRouter);
router.use('/items', itemRouter);
router.use('/attachments', attachmentRouter);
router.use('/attachmentTypes', attachmentTypeRouter);
router.use('/notes', noteRouter);
router.use('/tags', tagRouter);

export default router;
