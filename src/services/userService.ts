import UserModel, { User } from '../schemas/userSchema';
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import GroupModel, { Group } from '../schemas/groupSchema';
import { LeanDocument } from 'mongoose';
import { SendFollowNotification } from './notificationService';
import firebase, { DeleteFile, UploadFileToBucket } from './firebaseService';

export const CheckUserIdInUse = async (firebaseUserId: string): Promise<boolean> => {
	return (await UserModel.find({ _id: firebaseUserId }).lean()).length > 0;
};

export const CreateUserAccount = async (firebaaseUserId: string, email: string, name: string): Promise<User> => {
	const user = await UserModel.create({
		_id: firebaaseUserId,
		name: name,
		email: email
	});
	return user;
};

export const SearchUsers = async (query: string, userId: string): Promise<LeanDocument<User>[]> => {
	let users = await UserModel.find({ name: { $regex: query, $options: 'i' } })
		.limit(20)
		.lean();
	return users.filter((u) => u._id != userId);
};

export const GetMyProfile = async (userId: string): Promise<any> => {
	let user = await UserModel.findById(userId).lean();

	user.followersCount = user.followedByUsers ? user.followedByUsers.length : 0;
	user.followingCount = user.followingUsers ? user.followingUsers.length : 0;
	user.timeCapsulesCount = await TimeCapsuleModel.count({ owner: userId });

	// no need to send these fields to the client
	delete user.followedByUsers;
	delete user.followingUsers;
	delete user.email;
	delete user.prefferedTags;

	return user;
};

export const GetUserProfile = async (userId: string, requestingUserId: string): Promise<any> => {
	let user = await UserModel.findById(userId).lean();
	if (!user) return;

	user.isFollowedByMe = user.followedByUsers ? user.followedByUsers.includes(requestingUserId) : false;
	user.followersCount = user.followedByUsers ? user.followedByUsers.length : 0;
	user.followingCount = user.followingUsers ? user.followingUsers.length : 0;

	// no need to send these fields to the client
	delete user.followedByUsers;
	delete user.followingUsers;
	delete user.email;
	delete user.prefferedTags;

	return user;
};

export const GetRawUser = async (userId: string): Promise<User> => {
	return await UserModel.findById(userId).lean();
};

export const ToggleFollow = async (followedId: string, followerId: string, toggle: boolean) => {
	if (toggle) {
		await UserModel.updateOne({ _id: followedId }, { $push: { followedByUsers: followerId } });
		await UserModel.updateOne({ _id: followerId }, { $push: { followingUsers: followedId } });
		await SendFollowNotification(followerId, followedId);
	} else {
		await UserModel.updateOne({ _id: followedId }, { $pull: { followedByUsers: followerId } });
		await UserModel.updateOne({ _id: followerId }, { $pull: { followingUsers: followedId } });
	}
};

export const UpdateUser = async (userId: string, name: string) => {
	await UserModel.findByIdAndUpdate(userId, { name: name });
};

export const DeleteUserProfile = async (userId: string) => {
	await DeleteProfilePicture(userId);
	await UserModel.deleteOne({ _id: userId });
	await NotificationModel.deleteMany({ toUser: userId });
	await TimeCapsuleModel.deleteMany({ owner: userId });
	await GroupModel.deleteMany({ owner: userId });

	if (process.env.NODE_ENV != 'test') {
		try {
			await firebase.admin.auth().deleteUser(userId);
		} catch (e) {
			console.log(e.code, e.message);
		}
	}
};

export const UpdateProfilePicture = async (userId: string, file: Express.Multer.File) => {
	let fileUrl = await UploadFileToBucket(file, 'user/profilePicture', userId);
	fileUrl += `?v=${new Date().getTime()}`;
	await UserModel.findByIdAndUpdate(userId, { profileImageUrl: fileUrl });
	return fileUrl;
};

export const DeleteProfilePicture = async (userId: string) => {
	const user = await UserModel.findById(userId);
	if (user.profileImageUrl) {
		await DeleteFile(user.profileImageUrl);
	}
	await UserModel.findByIdAndUpdate(userId, { profileImageUrl: '' });
};
