import * as fs from 'fs/promises';
import multer, { FileFilterCallback, Multer, type StorageEngine } from 'multer';
import sharp from 'sharp';
import { createError } from './errorFactory';

type File = Express.Multer.File;
type Request = Express.Request;

type DynamicStringCreator = (req: Request, file: File) => string;
type FileFilter = multer.Options['fileFilter'];
interface ResizeObject {
	resize?: [number, number];
	quality?: number;
}

const fileFilter = {
	any: (req: Request, file: File, cb: FileFilterCallback) => {
		if (!file) cb(createError(400, 'No File Found'));
		else cb(null, true);
	},
	image: (req: Request, file: File, cb: FileFilterCallback) => {
		if (file.mimetype.startsWith('image')) {
			cb(null, true);
		} else {
			cb(createError(400, 'Not supported as image'));
		}
	},
	video: (req: Request, file: File, cb: FileFilterCallback) => {
		if (file.mimetype.startsWith('video')) cb(null, true);
		else cb(createError(400, 'Not supported as video'));
	},
	subtitle: (req: Request, file: File, cb: FileFilterCallback) => {
		if (file.mimetype.split('/')[1] === 'srt') cb(null, true);
		else cb(createError(400, 'Not supported as subtitle'));
	}
} as const;
type FileFilterKey = keyof typeof fileFilter;

export default class FileManager {
	readonly uploader: Multer;
	readonly path: string = '';

	constructor(filterKey: FileFilterKey, storage: StorageEngine);
	constructor(filterKey: FileFilterKey, dest: string);
	constructor(filterKey: FileFilterKey, savior: StorageEngine | string) {
		if (typeof savior === 'string') {
			this.path = savior;

			this.uploader = multer({
				dest: savior,
				fileFilter: fileFilter[filterKey]
			});
		} else
			this.uploader = multer({
				storage: savior,
				fileFilter: fileFilter[filterKey]
			});
	}

	/**
	 * creates a diskStorage object for uploads
	 * @param {DynamicStringCreator} destinationCreator - uses the (req, file) parameters to create destination string
	 * @param {DynamicStringCreator} filenameCreator - uses the (req, file) parameters to create filename
	 * @returns multer.diskStorage object
	 */
	static createDiskStorage(
		destinationCreator: DynamicStringCreator,
		filenameCreator: DynamicStringCreator
	): StorageEngine {
		return multer.diskStorage({
			destination: (req, file, cb) => cb(null, destinationCreator(req, file)),
			filename: (req, file, cb) => cb(null, filenameCreator(req, file))
		});
	}

	static createMemoryStorage(): StorageEngine {
		return multer.memoryStorage();
	}

	async hasFile(name: string, path: string = this.path): Promise<boolean> {
		if (path === '') return false;
		try {
			await fs.access(`${path}/${name}`, fs.constants.F_OK);
			return false;
		} catch {
			return true;
		}
	}

	async renameFile(
		prevName: string,
		newName: string,
		path: string = this.path
	) {
		path = `${__dirname}/${path}`;
		await fs.rename(`${path}/${prevName}`, `${path}/${newName}`);
	}

	/**
	 * resizes and saves the image in memory by the specified qualities
	 * if no resizeObject is specified, a general profile editor will be used
	 * @param {File} file - the file in need of edit
	 * @param {string} fileFullPath - the destination path and filename
	 * @param {ResizeObject} resizeObject - containing the resize aspect array, and quality
	 */
	async resizeImage(
		file: File,
		fileFullPath: string,
		resizeObject: ResizeObject = {}
	): Promise<File> {
		file.filename = fileFullPath.split('/')[-1];
		const { resize = [500, 500], quality = 90 } = resizeObject;

		await sharp(file.buffer)
			.resize(...resize)
			.toFormat('jpeg')
			.jpeg({ quality: quality })
			.toFile(fileFullPath);

		return file;
	}
}
