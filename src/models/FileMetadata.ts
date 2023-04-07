import { model, Schema } from "mongoose";

export interface IFile {
	title: string;
	tags?: {
		name: string,
		color: string
	}[];
}
