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

router.get('/settings', (req, res, next) => {
	const { SITE_URL, APP_VER, PRIVACY_POLICY_TEXT } = process.env;

	res.status(200).json({
		status: 'success',
		data: {
			siteURL: SITE_URL,
			appVer: APP_VER,
			privacyPolicy: PRIVACY_POLICY_TEXT
		}
	});
});

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
