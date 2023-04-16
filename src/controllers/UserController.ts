import { NextFunction, Response } from 'express';
import User from '../models/User';
import Controller from '../utils/Controller';
import { type IRequest } from '../utils/types';

interface ILogin extends IRequest {
	body: {
		email: string;
		password: string;
	};
}

export class UserController extends Controller<typeof User> {
	constructor() {
		super(User);
	}

	async login(req: IRequest, res: Response, next: NextFunction) {}
}
