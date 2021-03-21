import NotificationModel, { Notification } from '../schemas/notificationSchema';

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

export {
    sendNotificatioins_CreateGroup,
    sendNotificatioins_UpdateGroup,
}