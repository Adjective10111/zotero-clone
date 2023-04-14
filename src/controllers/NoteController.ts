import Note from '../models/Note';
import Controller from '../utils/Controller';

export class NoteController extends Controller<typeof Note> {
	constructor() {
		super(Note);
	}
}
