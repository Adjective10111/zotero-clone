import User from '../models/User';
import Controller from '../utils/Controller';

export class UserController extends Controller<typeof User> {
	constructor() {
		super(User);
	}
}
