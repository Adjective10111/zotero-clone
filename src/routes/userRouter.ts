import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();
const controller = new UserController();

router.post(
	'/signup',
	// uploadProfile,
	controller.validateBody.signUp,
	controller.validateRoleValue,
	controller.removeField.password,
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

router.route('/me').get(controller.sendResponse('getOne')).patch(
	// uploadProfile,
	controller.validateBody.patch,
	controller.validateRoleValue,
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
