import { RequestHandler } from 'express';
import 'reflect-metadata';
import { Decorator, RouteHandlerDescriptor } from '../types';
import { MetadataKeys } from './MetadataKeys';

/**
 * adds a middleware to the middleware stack to be triggered before the endpoint
 * the middlewares are triggered from last to first like a stack
 *
 * @param middleware the middleware to be added to the stack
 * @returns the decorator
 */
export function Use(middleware: RequestHandler): Decorator {
	return function (target: any, key: string, desc: RouteHandlerDescriptor) {
		const middlewareStack =
			Reflect.getMetadata(MetadataKeys.Middleware, target, key) || [];
		Reflect.defineMetadata(
			MetadataKeys.Middleware,
			[...middlewareStack, middleware],
			target,
			key
		);
	};
}

export function getMiddlewares(target: any, key: string): RequestHandler[] {
	return Reflect.getMetadata(MetadataKeys.Middleware, target, key) || [];
}
