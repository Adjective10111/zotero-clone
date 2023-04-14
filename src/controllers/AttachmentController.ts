import Attachment from '../models/Attachment';
import Controller from '../utils/Controller';

export class AttachmentController extends Controller<typeof Attachment> {
	constructor() {
		super(Attachment);
	}
}
