import { NextFunction, Response } from 'express';
import FileManager from '../utils/FileManager';
import { catchAsync } from '../utils/errorFactory';
import { IRequest } from '../utils/types';

export default class FileController {
	constructor(private fileManager: FileManager) {}

	static createImageController() {
		return new FileController(
			new FileManager('image', FileManager.createMemoryStorage())
		);
	}

	static createFileController() {
		return new FileController(
			new FileManager(
				'any',
				FileManager.createDiskStorage(
					(req: IRequest, file) => `${__dirname}/../private`,
					(req: IRequest, file) => {
						let attachment = req.attachment;
						if (!req.attachment) {
							attachment = req.body;
							if (req.item) attachment.parent = req.item.id;
						}
						const extension = file.originalname.split('.').pop();

						req.filename = `${attachment.parent}-${attachment.type}-${attachment.name}.${extension}`;
						return req.filename;
					}
				)
			)
		);
	}

	uploadProfile = this.fileManager.uploader.single('profile');
	uploadLogo = this.fileManager.uploader.single('logo');
	uploadIcon = this.fileManager.uploader.single('icon');
	uploadFile = this.fileManager.uploader.single('file');

	async downloadFile(req: IRequest, res: Response, next: NextFunction) {
		const outName = req.filename.split('-').pop();
		res.download(`${req.filePath}/${req.filename}`, outName, (err: Error) => {
			if (err && !res.headersSent)
				res.status(404).json({
					status: 'failed',
					error: 'invalid path'
				});
		});
	}

	resizeProfile = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			const fileId = !req.user ? req.body.email : req.user.email;

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
			const fileId = !req.group ? req.body.name : req.group.name;

			req.file = await this.fileManager.resizeImage(
				req.file,
				`${__dirname}/../public/logos/${fileId}.jpg`
			);

			req.file.path = `logos/${fileId}.jpg`;
			next();
		}
	);

	resizeIcon = catchAsync(
		async (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			const fileId = !req.attachmenttype
				? req.body.name
				: req.attachmenttype.name;

			req.file = await this.fileManager.resizeImage(
				req.file,
				`${__dirname}/../public/icons/${fileId}.png`,
				{ format: 'png' }
			);

			req.file.path = `icons/${fileId}.png`;
			next();
		}
	);

	addFilePath(bodyKey: string) {
		return (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			req.body[bodyKey] = req.file.path;
			next();
		};
	}

	addFileName(bodyKey: string) {
		return (req: IRequest, res: Response, next: NextFunction) => {
			if (!req.file) return next();
			req.body[bodyKey] = req.file.filename;
			next();
		};
	}

	static async deleteFile(filename: string) {
		await FileManager.deleteFile(`${__dirname}/../private/${filename}`);
	}
}
