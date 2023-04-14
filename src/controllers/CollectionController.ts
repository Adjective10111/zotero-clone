import Collection from '../models/Collection';
import Controller from '../utils/Controller';

export class CollectionController extends Controller<typeof Collection> {
	constructor() {
		super(Collection);
	}
}
