import GroupModel, { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import { SendAddedToGroupNotifications } from './notificationService';

export const IsGroupNameUnique = async (name: string, userId: string): Promise<boolean> => {
	return (await GroupModel.find({ name: name, owner: userId })).length == 0;
};

export const CountUserGroups = async (userId: string): Promise<number> => {
	return await GroupModel.countDocuments({ owner: userId });
};

export const CreateGroup = async (name: string, users: string[], owner: string): Promise<Group> => {
	let group = await GroupModel.create({
		name: name,
		users: users,
		owner: owner,
		usersCount: users.length
	});
	SendAddedToGroupNotifications(group._id, users, owner);
	return group;
};

export const LeaveGroup = async (groupId: string, userId: string) => {
	await GroupModel.updateOne({ _id: groupId }, { $pull: { users: userId } });
	await NotificationModel.deleteOne({ toUser: userId, group: groupId, type: 'addedToGroup' });
};

export const UpdateGroup = async (groupId: string, userId: string, groupName: string, users: string[]): Promise<Group> => {
	let updatedGroup = await GroupModel.findOneAndUpdate({ _id: groupId, owner: userId }, { name: groupName, users: users, usersCount: users.length }, { new: true });

	SendAddedToGroupNotifications(updatedGroup._id, users, userId);

	return updatedGroup;
};

export const GetAllUserGroups = async (userId: string): Promise<Group[]> => {
	return await GroupModel.find({ owner: userId }).select('-users -__v -owner').lean();
};

export const GetGroupsContainingMe = async (userId: string): Promise<Group[]> => {
	return await GroupModel.find({ users: userId }).select('-users -__v -owner').lean();
};

export const GetGroupById = async (groupId: string, ownerId: string): Promise<Group> => {
	return await GroupModel.findOne({ _id: groupId, owner: ownerId }).populate('users').select('-__v -owner').lean();
};

export const DeleteGroup = async (groupId: string, ownerId: string): Promise<boolean> => {
	let result = await GroupModel.deleteOne({ _id: groupId, owner: ownerId });
	await TimeCapsuleModel.updateMany({}, { $pull: { allowedGroups: groupId } });
	return result.n == 1;
};
