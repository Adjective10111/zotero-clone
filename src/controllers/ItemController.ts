import Item from '../models/Item';
import Controller from '../utils/Controller';

export class ItemController extends Controller<typeof Item> {
	constructor() {
		super(Item);
	}
}
