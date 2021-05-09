import * as  _ from 'lodash';
import { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import timeCapsuleSchema from '../schemas/timeCapsuleSchema';
import TimeCapsulenModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';

const sendNotificatioins_CreateGroup = async (group) => {
    group.users.forEach(async (user) => {
        await NotificationModel.create({
            timeCapsule: null,
            byUser: group.owner,
            toUser: user,
            time: new Date(),
            group: group.id
        });
    })
}

const sendNotificatioins_UpdateGroup = async (oldGroup, updatedGroup) => {
    updatedGroup.users.forEach(async (user) => {
        // If the 'user' is not present in the list of users from the
        // old group ('oldGroup.users'), then it means that it's a new user 
        if (!oldGroup.users.includes(user)) {
            await NotificationModel.create({
                timeCapsule: null,
                byUser: updatedGroup.owner,
                toUser: user,
                time: new Date(),
                group: updatedGroup.id
            });
        }
    })
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

setInterval(() => {
    SendTimeCapsuleOpenNotification();
}, 10000);



export {
    sendNotificatioins_CreateGroup,
    sendNotificatioins_UpdateGroup,
}