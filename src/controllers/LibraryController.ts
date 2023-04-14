import Library from '../models/Library';
import Controller from '../utils/Controller';

export class LibraryController extends Controller<typeof Library> {
	constructor() {
		super(Library);
	}
}
