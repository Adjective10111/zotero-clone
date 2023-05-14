import { NextFunction, Response } from 'express';
import FileManager from '../utils/FileManager';
import { createError } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class FileController {
	constructor(private fileManager: FileManager) {}

	uploadProfile = this.fileManager.uploader.single('profile');
	uploadLogo = this.fileManager.uploader.single('logo');
	uploadFile = this.fileManager.uploader.single('file');

	async resizeProfile(req: IRequest, res: Response, next: NextFunction) {
		if (!req.file) return next();
		req.file = await this.fileManager.resizeImage(
			req.file,
			`public/profiles/${req.user?.id}.jpg`
		);
		next();
	}

	async resizeLogo(req: IRequest, res: Response, next: NextFunction) {
		if (!req.file) return next();
		req.file = await this.fileManager.resizeImage(
			req.file,
			`public/logos/${req.group?.id}.jpg`
		);
		next();
	}

	addFilePath(bodyKey: string) {
		return (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			req[bodyKey] = req.file.path;
			next();
		};
	}
}
