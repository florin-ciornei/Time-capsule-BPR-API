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
	subscribedUsers: string[],
	reactions: { reaction: string, userId: string }[]
	owner: string,
	location: {
		lat: number,
		lon: number,
	},
	backgroundType: number,
	contents: { url: string, mimeType: string }[],
	isOpened: boolean,
	isSubscribed?: boolean,
	reactionsLean?: { reaction: string, count: number }[]
	myReaction?: string,
	openNotificationSent: boolean
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
		subscribedUsers: [{ type: String, ref: 'User' }],
		reactions: [{ _id: false, reaction: { type: String }, userId: { type: String, ref: 'User' } }],
		owner: { type: String, ref: 'User' },
		location: {
			lat: Number,
			lon: Number,
		},
		backgroundType: Number,
		contents: [{ url: String, mimeType: String, _id: false }],
		openNotificationSent: Boolean
	},
);

export default mongoose.model<TimeCapsule>('TimeCapsule', TimeCapsuleSchema);