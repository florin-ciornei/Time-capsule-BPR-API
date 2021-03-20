import * as mongoose from "mongoose";

export interface TimeCapsule extends mongoose.Document {
	name: string,
	description: string,
	openDate: Date,
	createDate: Date,
	isPrivate: boolean,
	allowedUsers: string[],
	allowedGroups: string[],
	owner: string,
	location: {
		lat: number,
		lon: number,
	},
	backgroundType: number
}

const TimeCapsuleSchema: mongoose.Schema = new mongoose.Schema(
	{
		name: String,
		description: String,
		openDate: Date,
		createDate: Date,
		isPrivate: Boolean,
		allowedUsers: [{ type: String, ref: 'User' }],
		allowedGroups: [{ type: String, ref: 'Group' }],
		owner: { type: String, ref: 'User' },
		location: {
			lat: Number,
			lon: Number,
		},
		backgroundType: Number
	},
);

export default mongoose.model<TimeCapsule>('TimeCapsule', TimeCapsuleSchema);