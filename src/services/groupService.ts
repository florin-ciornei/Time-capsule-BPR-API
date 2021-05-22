import GroupModel, { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from "../schemas/notificationSchema";

export const CreateGroup = async (req) => {
    let name: string = req.body.name;
    let users: string[] = req.body.users;
    let owner: string = req.userId;
    let usersCount: number = users.length;

    let group = await GroupModel.create({
        name: name,
        users: users,
        owner: owner,
        usersCount: usersCount
    });

    return group;
}

export const LeaveGroup = async (req) => {
    let groupId = req.params.groupId;

    await GroupModel.updateOne({ _id: groupId }, { $pull: { users: req.userId } });
    await NotificationModel.deleteOne({ toUser: req.userId, group: groupId, type: "addedToGroup" });
}

export const UpdateGroup = async (req) => {
    let groupId = req.params.id;
    let name: string = req.body.name;
    let users: string[] = req.body.users;
    let usersCount = users.length;
    let owner: string = req.userId;
    
    let updatedGroup = await GroupModel.findOneAndUpdate(
        { _id: groupId, owner: owner },
        { name: name, users: users, usersCount: usersCount },
        { new: true });
        
    return updatedGroup;
}

export const DeleteGroup = async (req) => {
    return await GroupModel.deleteOne({ _id: req.params.id, owner: req.userId });
}

export const GetMyGroups = async (req) => {
    return await GroupModel.find({ owner: req.userId }).select("-users -__v -owner").lean();
}

export const FindGroup = async (req) => {
    return await GroupModel.findOne({ _id: req.params.id, owner: req.userId })
    .populate("users").select("-__v -owner").lean();
}