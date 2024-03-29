import * as mongoose from 'mongoose';

export interface User extends mongoose.Document {
	_id: string;
	name: string;
	profileImageUrl: string;
	email: string;
	followedByUsers: string[];
	followingUsers: string[];
	prefferedTags: string[];

	// calculated at runtime, not stored in MongoDB
	isFollowedByMe: boolean;
	followersCount: number;
	followingCount: number;
	timeCapsulesCount: number;
}

const UserSchema: mongoose.Schema = new mongoose.Schema(
	{
		_id: String, //this id is the same id as in firebase
		name: String,
		profileImageUrl: { type: String, default: '' },
		email: String,
		followedByUsers: [{ type: String, ref: 'User' }],
		followingUsers: [{ type: String, ref: 'User' }],
		prefferedTags: [{ type: String }]
	},
	{ _id: false }
);

export default mongoose.model<User>('User', UserSchema);
