import * as  _ from 'lodash';
import { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import timeCapsuleSchema from '../schemas/timeCapsuleSchema';
import TimeCapsulenModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';

export const SendAddedToGroupNotifications = async (groupId: string, userIds: string[], byUserId: string) => {
    for (let i = 0; i < userIds.length; i++) {
        let userId = userIds[i];
        let existingNotification = await NotificationModel.countDocuments({ toUser: userId, group: groupId, type: "addedToGroup" });
        // dont add notification if it already exists for this user
        if (existingNotification > 0)
            continue;
        await NotificationModel.create({
            timeCapsule: undefined,
            byUser: byUserId,
            toUser: userId,
            time: new Date(),
            group: groupId,
            type: "addedToGroup"
        });
    }
}

export const SendAddedToAllowedUsersNotifications = async (capsuleId: string, userIds: string[], byUserId: string) => {
    for (let i = 0; i < userIds.length; i++) {
        let userId = userIds[i];
        let existingNotification = await NotificationModel.countDocuments({ toUser: userId, timeCapsule: capsuleId, type: "addedToAllowedUsers" });
        console.log(existingNotification);
        // dont add notification if it already exists for this user
        if (existingNotification > 0)
            continue;
        await NotificationModel.create({
            timeCapsule: capsuleId,
            byUser: byUserId,
            toUser: userId,
            time: new Date(),
            group: undefined,
            type: "addedToAllowedUsers"
        });
    }
}

export const SendSubScribeToTimeCapsuleNotification = async (timeCapsuleId: string, userId: string) => {
    let timeCapsule = await TimeCapsulenModel.findById(timeCapsuleId);
    let notificationExists = (await NotificationModel.countDocuments({ toUser: timeCapsule.owner, type: "subscribedToTimeCapsule" })) > 0;
    if (notificationExists)
        return;
    NotificationModel.create({
        timeCapsule: timeCapsule._id,
        byUser: userId,
        toUser: timeCapsule.owner,
        time: new Date(),
        group: undefined,
        type: "subscribedToTimeCapsule"
    });
}

const SendTimeCapsuleOpenNotification = async () => {
    //find capsules that opened but we did not send notifications to them
    const filter = { openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } };
    const timeCapsules = await timeCapsuleSchema.find({ openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } }).populate("allowedGroups").lean();

    // build the array with user IDs to whom open notification is sent
    timeCapsules.forEach(t => {
        let sendNotificationToTheseUsers: string[] = [];
        sendNotificationToTheseUsers.push(t.owner);
        sendNotificationToTheseUsers.push(...t.allowedUsers);
        let groups = ((t.allowedGroups as any) as Group[]);
        groups.forEach((g) => {
            sendNotificationToTheseUsers.push(...g.users);
        });

        sendNotificationToTheseUsers = _.uniq(sendNotificationToTheseUsers);

        sendNotificationToTheseUsers.forEach(userId => {
            NotificationModel.create({
                timeCapsule: t._id,
                byUser: undefined,
                toUser: userId,
                time: new Date(),
                group: undefined,
                type: "timeCapsuleOpened"
            });
        })
    });

    await timeCapsuleSchema.updateMany({ openDate: { $lt: new Date() }, openNotificationSent: { $in: [false, null, undefined] } }, { openNotificationSent: true })
}

export const sendFollowNotification = async (byUserId: string, toUserId: string) => {
    let notificationExists = (await NotificationModel.countDocuments({ toUser: toUserId, byUser: byUserId, type: "follow" })) > 0;
    if (notificationExists)
        return;
    NotificationModel.create({
        timeCapsule: undefined,
        byUser: byUserId,
        toUser: toUserId,
        time: new Date(),
        group: undefined,
        type: "follow"
    });
}

if (process.env.NODE_ENV != "test") {
    setInterval(() => {
        SendTimeCapsuleOpenNotification();
    }, 10000);
}
