import { Router } from 'express';

export default class SingletonRouter {
	private static router: Router;

	static getInstance() {
		if (!SingletonRouter.router) SingletonRouter.router = Router();
		return SingletonRouter.router;
	}
}
