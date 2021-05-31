import * as _ from 'lodash';
import { LeanDocument } from 'mongoose';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import timeCapsuleSchema from '../schemas/timeCapsuleSchema';
import TimeCapsulenModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import GroupModel, { Group } from '../schemas/groupSchema';

export const GetUserNotifications = async (page: number, resultsPerPage: number, userId: string): Promise<LeanDocument<Notification>[]> => {
	let notifications = await NotificationModel.find({ toUser: userId })
		.populate('byUser', '_id name profilePictureUrl')
		.populate('group', '_id name')
		.populate('timeCapsule', '_id name openData description backgroundType')
		.sort({ time: -1 })
		.skip(page * resultsPerPage)
		.limit(resultsPerPage)
		.lean();

	notifications.forEach((n) => {
		delete n.__v;
		delete n._id;
		delete n.toUser;
	});
	return notifications;
};

export const SendAddedToGroupNotifications = async (groupId: string, userIds: string[], byUserId: string) => {
	for (let i = 0; i < userIds.length; i++) {
		let userId = userIds[i];
		let existingNotification = await NotificationModel.countDocuments({ toUser: userId, group: groupId, type: 'addedToGroup' });
		// dont add notification if it already exists for this user
		if (existingNotification > 0) continue;
		await NotificationModel.create({
			timeCapsule: undefined,
			byUser: byUserId,
			toUser: userId,
			time: new Date(),
			group: groupId,
			type: 'addedToGroup'
		});
	}
};

export const SendAddedToAllowedUsersNotifications = async (capsuleId: string, userIds: string[], byUserId: string) => {
	for (let i = 0; i < userIds.length; i++) {
		let userId = userIds[i];
		let existingNotification = await NotificationModel.countDocuments({ toUser: userId, timeCapsule: capsuleId, type: 'addedToAllowedUsers' });
		// dont add notification if it already exists for this user
		if (existingNotification > 0) continue;
		await NotificationModel.create({
			timeCapsule: capsuleId,
			byUser: byUserId,
			toUser: userId,
			time: new Date(),
			group: undefined,
			type: 'addedToAllowedUsers'
		});
	}
};

/**
 * Sends a notification the the users in groups that were added to a new time capsule
 * @param capsuleId the id of the created time capsules
 * @param ownerId the id of user who created the time capsule
 * @param groupsIds the list of ids the groups that were added to the time capsule
 */
export const SendNewCapsuleCreatedNotifications = async (capsuleId: string, ownerId: string, groupsIds: string[]) => {
	for (let i = 0; i < groupsIds.length; i++) {
		const group = await GroupModel.findById(groupsIds[i]);
		for (let j = 0; j < group.users.length; j++) {
			const toUserId = group.users[j];
			let existingNotification = await NotificationModel.countDocuments({ toUser: toUserId, timeCapsule: capsuleId, group: group._id, type: 'newCapsuleCreated' });
			// dont add notification if it already exists for this user
			if (existingNotification > 0) continue;
			await NotificationModel.create({
				timeCapsule: capsuleId,
				byUser: ownerId,
				toUser: toUserId,
				time: new Date(),
				group: group._id,
				type: 'newCapsuleCreated'
			});
		}
	}
};

export const SendSubScribeToTimeCapsuleNotification = async (timeCapsuleId: string, userId: string) => {
	let timeCapsule = await TimeCapsulenModel.findById(timeCapsuleId);
	let notificationExists = (await NotificationModel.countDocuments({ toUser: timeCapsule.owner, type: 'subscribedToTimeCapsule' })) > 0;
	if (notificationExists) return;
	NotificationModel.create({
		timeCapsule: timeCapsule._id,
		byUser: userId,
		toUser: timeCapsule.owner,
		time: new Date(),
		group: undefined,
		type: 'subscribedToTimeCapsule'
	});
};

const SendTimeCapsuleOpenNotification = async () => {
	//find capsules that opened but we did not send notifications to them
	const filter = { openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } };
	const timeCapsules = await timeCapsuleSchema
		.find({ openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } })
		.populate('allowedGroups')
		.lean();

	// build the array with user IDs to whom open notification is sent
	timeCapsules.forEach((t) => {
		let sendNotificationToTheseUsers: string[] = [];
		sendNotificationToTheseUsers.push(t.owner);
		sendNotificationToTheseUsers.push(...t.allowedUsers);
		let groups = (t.allowedGroups as any) as Group[];
		groups.forEach((g) => {
			sendNotificationToTheseUsers.push(...g.users);
		});

		sendNotificationToTheseUsers = _.uniq(sendNotificationToTheseUsers);

		sendNotificationToTheseUsers.forEach((userId) => {
			NotificationModel.create({
				timeCapsule: t._id,
				byUser: undefined,
				toUser: userId,
				time: new Date(),
				group: undefined,
				type: 'timeCapsuleOpened'
			});
		});
	});

	await timeCapsuleSchema.updateMany({ openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } }, { openNotificationSent: true });
};

export const SendFollowNotification = async (byUserId: string, toUserId: string) => {
	let notificationExists = (await NotificationModel.countDocuments({ toUser: toUserId, byUser: byUserId, type: 'follow' })) > 0;
	if (notificationExists) return;
	NotificationModel.create({
		timeCapsule: undefined,
		byUser: byUserId,
		toUser: toUserId,
		time: new Date(),
		group: undefined,
		type: 'follow'
	});
};

// if (process.env.NODE_ENV != 'test') {
// 	console.log('Start lookin for opened capsules...');
// 	setInterval(() => {
// 		SendTimeCapsuleOpenNotification();
// 	}, 10000);
// }
