import * as mongoose from "mongoose";

export interface TimeCapsule extends mongoose.Document {
	name: string,
	description: string,
	openDate: Date,
	createDate: Date,
	isPrivate: boolean,
	tags: string[],
	allowedUsers: string[],
	allowedGroups: string[],
	owner: string,
	location: {
		lat: number,
		lon: number,
	},
	backgroundType: number,
	contents: { url: string, mimeType: string }[],
	isOpened: boolean
}

const TimeCapsuleSchema: mongoose.Schema = new mongoose.Schema(
	{
		name: String,
		description: String,
		openDate: Date,
		createDate: Date,
		isPrivate: Boolean,
		tags: [{ type: String }],
		allowedUsers: [{ type: String, ref: 'User' }],
		allowedGroups: [{ type: String, ref: 'Group' }],
		owner: { type: String, ref: 'User' },
		location: {
			lat: Number,
			lon: Number,
		},
		backgroundType: Number,
		contents: [{ url: String, mimeType: String, _id: false }],
	},
);

export default mongoose.model<TimeCapsule>('TimeCapsule', TimeCapsuleSchema);