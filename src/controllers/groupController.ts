import * as express from 'express';
import * as mongoose from 'mongoose';
import { idText } from 'typescript';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import NotificationModel, { Notification } from "../schemas/notificationSchema";

const ObjectId = mongoose.Types.ObjectId;
import { SendAddedToGroupNotifications } from '../services/notificationService';
import * as GroupService from '../services/groupService';


const router = express.Router();

router.post('/createGroup', async (req, res) => {
    let group = GroupService.CreateGroup(req);

    SendAddedToGroupNotifications(group._id, group.users, group.owner);

    res.status(200).send({
        status: 'success',
        message: 'Group created!',
        group: group
    });
});

router.put('/leaveGroup/:groupId', async (req, res) => {
    GroupService.LeaveGroup(req);

    res.status(200).send({
        status: 'success',
        message: 'Group left, notification deleted!',
    });
});

router.put('/updateGroup/:id', async (req, res) => {
    let groupId = req.params.id;

    if (!ObjectId.isValid(groupId))
    {
        return res.status(400).send({
            status: "error",
            message: "Group id is not a valid id"
        });
    }
    
    let updatedGroup = GroupService.UpdateGroup(req);

    SendAddedToGroupNotifications(updatedGroup._id, updatedGroup.users, updatedGroup.owner);

    res.status(200).send({
        status: 'success',
        message: 'Group updated!',
        group: updatedGroup
    });
});

router.delete('/deleteGroup/:id', async (req, res) => {
    let result = GroupService.DeleteGroup(req);

    if (result.n === 1) {
        res.status(200).send({
            status: 'success',
            message: 'Group deleted!',
        });
    } else {
        res.status(400).send({
            status: 'error',
            message: 'Did not delete. The group was not found, or it does not belong to you.',
        });
    }
});

router.get("/getMyGroups", async (req, res) => {
    let groups = GroupService.GetMyGroups(req);

    res.status(200).send({
        status: 'success',
        groups: groups,
        results: groups.length
    });
});

router.get("/findGroup/:id", async (req, res) => {
    let groupId = req.params.id;

    if (!ObjectId.isValid(groupId))
        return res.status(400).send({
            status: "error",
            message: "Group id is not a valid id"
        });

    let group = GroupService.FindGroup(req);

    if (!group)
        return res.status(400).send({
            status: "error",
            message: "Group not found. Either the id is incorrect, or the group doesn't belong to you."
        });

    res.status(200).send({
        status: 'success',
        group: group
    });
});

export default router;
