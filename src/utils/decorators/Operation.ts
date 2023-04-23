import 'reflect-metadata';
import { CRUD, Decorator, RouteHandlerDescriptor } from '../types';
import { MetadataKeys } from './MetadataKeys';

export function Operation(operation: CRUD): Decorator {
	return function (target: any, key: string, desc: RouteHandlerDescriptor) {
		Reflect.defineMetadata(MetadataKeys.Operation, operation, target, key);
	};
}

export function getOperation(target: any, key: string): CRUD | undefined {
	return Reflect.getMetadata(MetadataKeys.Operation, target, key);
}
