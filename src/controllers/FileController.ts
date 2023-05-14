import { NextFunction, Response } from 'express';
import FileManager from '../utils/FileManager';
import { catchAsync, createError } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class FileController {
	constructor(private fileManager: FileManager) {}

	static createImageController() {
		return new FileController(
			new FileManager('image', FileManager.createMemoryStorage())
		);
	}

	uploadProfile = this.fileManager.uploader.single('profile');
	uploadLogo = this.fileManager.uploader.single('logo');
	uploadFile = this.fileManager.uploader.single('file');

	resizeProfile = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			const fileId = !req.user ? `${req.body.email}` : req.user.id;

			req.file = await this.fileManager.resizeImage(
				req.file,
				`${__dirname}/../public/profiles/${fileId}.jpg`
			);

			req.file.path = `profiles/${fileId}.jpg`;
			next();
		}
	);

	resizeLogo = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			const fileId = !req.group
				? `${req.body.name}-${Date.now()}`
				: req.group.id;

			req.file = await this.fileManager.resizeImage(
				req.file,
				`${__dirname}/../public/logos/${fileId}.jpg`
			);

			req.file.path = `logos/${fileId}.jpg`;
			next();
		}
	);

	addFilePath(bodyKey: string) {
		return (req: IRequest, res: Response, next: NextFunction) => {
			console.log(req.file?.path);
			if (!req.file) return next();
			req.body[bodyKey] = req.file.path;
			next();
		};
	}
}
