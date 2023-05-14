import { Router } from 'express';
import FileController from '../controllers/FileController';
import UserController from '../controllers/UserController';

const router = Router();
const controller = new UserController();
const fileController = FileController.createImageController();

router.post(
	'/signup',
	fileController.uploadProfile,
	controller.validateBody.signUp,
	controller.validateRoleValue,
	controller.removeField.password,
	fileController.resizeProfile,
	fileController.addFilePath('profile'),
	controller.debugLog,
	controller.createOne,
	controller.sendResponse('create')
);
router.post(
	'/login',
	controller.validateBody.login,
	controller.login,
	controller.sendResponse('login')
);
router.delete('/logout', controller.logout, controller.sendResponse('logout'));

// router.post(
// 	'/resetPassword',
// 	controller.validateBody.resetToken,
// 	controller.generateResetToken
// 	// sendEmail
// );
router.patch(
	'/resetPassword/:token',
	controller.validateBody.resetPassword,
	controller.resetPassword,
	controller.sendResponse('patch')
);

router.use(UserController.authenticate);

router
	.route('/me')
	.get(controller.sendResponse('getOne'))
	.patch(
		fileController.uploadProfile,
		controller.validateBody.patch,
		controller.validateRoleValue,
		fileController.resizeProfile,
		fileController.addFilePath('profile'),
		controller.patchDocument,
		controller.sendResponse('patch')
	);
router.patch(
	'/changePassword',
	controller.validateBody.changePassword,
	controller.changePassword,
	controller.sendResponse('patch')
);

router.delete('/terminateSessions', controller.terminateSessions);

export default router;
