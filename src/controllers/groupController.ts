import * as express from 'express';
import * as mongoose from 'mongoose';
import { idText } from 'typescript';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
const ObjectId = mongoose.Types.ObjectId;
import * as notificationService from "../services/notificationService";
import { SendAddedToGroupNotifications } from '../services/notificationService';


const router = express.Router();

router.post('/', async (req, res) => {
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

    SendAddedToGroupNotifications(group._id, users, req.userId);

    res.status(200).send({
        status: 'success',
        message: 'Group created!',
        group: group
    });
});

router.put('/:id', async (req, res) => {
    let groupId = req.params.id;
    let name: string = req.body.name;
    let users: string[] = req.body.users;
    let usersCount = users.length;
    let owner: string = req.userId;

    if (!ObjectId.isValid(groupId))
        return res.status(400).send({
            status: "error",
            message: "Group id is not a valid id"
        });

    let oldGroup = await GroupModel.findOne({ _id: req.params.id, owner: req.userId })
        .select("-_id -name -owner -usersCount -__v").lean();

    let updatedGroup = await GroupModel.findOneAndUpdate(
        { _id: groupId, owner: owner },
        { name: name, users: users, usersCount: usersCount },
        { new: true });

    SendAddedToGroupNotifications(updatedGroup._id, users, req.userId);

    res.status(200).send({
        status: 'success',
        message: 'Group updated!',
        group: updatedGroup
    });
});

router.delete('/delete/:id', async (req, res) => {
    let result = await GroupModel.deleteOne({ _id: req.params.id, owner: req.userId });
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

router.get("/all", async (req, res) => {
    let groups = await GroupModel.find({ owner: req.userId }).select("-users -__v -owner").lean();
    res.status(200).send({
        status: 'success',
        groups: groups,
        results: groups.length
    });
});

router.get("/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
        return res.status(400).send({
            status: "error",
            message: "Group id is not a valid id"
        });

    let group = await GroupModel.findOne({ _id: req.params.id, owner: req.userId })
        .populate("users").select("-__v -owner").lean();

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
