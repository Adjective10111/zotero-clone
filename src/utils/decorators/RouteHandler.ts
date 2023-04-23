import { NextFunction, Request, RequestHandler, Response } from 'express';
import { join } from 'path';
import 'reflect-metadata';
import { getMethod, getMiddlewares, getOperation, getPath } from '.';
import SingletonRouter from '../singletonRouter';
import { CRUD } from '../types';

const emptyHandler = (req: Request, res: Response, next: NextFunction) =>
	next();

export function RouteHandler(routePrefix: string) {
	return function (target: Function) {
		const router = SingletonRouter.getInstance();
		const prototype = target.prototype;

		console.log(target.prototype);
		for (let key in prototype) {
			const routeHandler = prototype[key];
			const path = getPath(prototype, key);
			const method = getMethod(prototype, key);
			const middlewareStack = getMiddlewares(prototype, key);
			const operation = getOperation(prototype, key);

			// adding the route
			if (path && method) {
				router[method](
					`${join(routePrefix, path)}`,
					...middlewareStack,
					routeHandler,
					operation ? prototype.sendCRUDOperation(operation) : emptyHandler
				);
			}
		}
	};
}
