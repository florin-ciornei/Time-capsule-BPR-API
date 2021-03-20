import NotificationModel, { Notification } from '../schemas/notificationSchema';

const sendNotificatioins = async (group) => {
    group.users.forEach(async (user) => {
        let notification = await NotificationModel.create({
            timeCapsule: null,
            byUser: group.owner,
            toUser: user,
            time: new Date(),
            group: group.id
        });
    })
}

export {
    sendNotificatioins
}