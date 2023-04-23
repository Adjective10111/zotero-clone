import 'reflect-metadata';
import { Decorator, RouteHandlerDescriptor } from '../types';
import { MetadataKeys, Method } from './MetadataKeys';

function endpoint(method: Method) {
	return function (path: string): Decorator {
		return function (target: any, key: string, desc: RouteHandlerDescriptor) {
			Reflect.defineMetadata(MetadataKeys.Method, method, target, key);
			Reflect.defineMetadata(MetadataKeys.Path, path, target, key);
		};
	};
}

export function getMethod(target: any, key: string): Method | undefined {
	return Reflect.getMetadata(MetadataKeys.Method, target, key);
}
export function getPath(target: any, key: string): string | undefined {
	return Reflect.getMetadata(MetadataKeys.Path, target, key);
}

export const Get = endpoint(Method.Get);
export const Post = endpoint(Method.Post);
export const Patch = endpoint(Method.Patch);
export const Delete = endpoint(Method.Delete);
