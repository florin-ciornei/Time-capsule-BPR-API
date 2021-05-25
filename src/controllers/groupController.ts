import * as express from 'express';
import * as mongoose from 'mongoose';
import { requireAuth } from '../routers/authRouters';
import { CountUserGroups, CreateGroup, DeleteGroup, GetAllUserGroups, GetGroupById, GetGroupsContainingMe, IsGroupNameUnique, LeaveGroup, UpdateGroup } from '../services/groupService';

const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();

// all the routes related to group should have authentiation
router.use(requireAuth);

/**
 * Create group.
 */
router.post('/', requireAuth, async (req, res) => {
	let name: string = req.body.name;
	let users: string[] = req.body.users;

	if (!(await IsGroupNameUnique(name, req.userId))) {
		return res.status(400).send({
			status: 'error',
			code: 'name_not_unique',
			message: 'You already have a group with this name!'
		});
	}

	if ((await CountUserGroups(req.userId)) >= 100) {
		return res.status(400).send({
			status: 'error',
			code: 'group_number_exceeded',
			message: 'You cannot have more than 100 groups!'
		});
	}

	if (name.length > 24 || name.length < 1) {
		return res.status(400).send({
			status: 'error',
			code: 'name_length_out_of_bounds',
			message: 'The group name should have 1-24 characters.'
		});
	}

	if (users && users.length > 100) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_users',
			message: 'The group cannot have more than 100 users.'
		});
	}

	let group = await CreateGroup(name, users, req.userId);

	res.status(200).send({
		status: 'success',
		message: 'Group created!',
		group: group
	});
});

/**
 * Leave a group to which you were added by someone else
 */
router.put('/leaveGroup/:groupId', async (req, res) => {
	let groupId = req.params.groupId;

	if (!ObjectId.isValid(groupId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Group id is not a valid id'
		});

	await LeaveGroup(groupId, req.userId);
	res.status(200).send({
		status: 'success',
		message: 'Group left, notification deleted!'
	});
});

router.put('/:id', async (req, res) => {
	let groupId = req.params.id;
	let name: string = req.body.name;
	let users: string[] = req.body.users;
	let owner: string = req.userId;

	if (!ObjectId.isValid(groupId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Group id is not a valid id'
		});

	if (name.length > 24 || name.length < 1) {
		return res.status(400).send({
			status: 'error',
			code: 'name_length_out_of_bounds',
			message: 'The group name should have 1-24 characters.'
		});
	}

	if (users && users.length > 100) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_users',
			message: 'The group cannot have more than 100 users.'
		});
	}

	let updatedGroup = await UpdateGroup(groupId, owner, name, users);

	res.status(200).send({
		status: 'success',
		message: 'Group updated!',
		group: updatedGroup
	});
});

router.delete('/delete/:id', async (req, res) => {
	let groupId = req.params.id;
	if (!ObjectId.isValid(groupId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Group id is not a valid id'
		});

	let result = await DeleteGroup(groupId, req.userId);
	if (result) {
		res.status(200).send({
			status: 'success',
			message: 'Group deleted!'
		});
	} else {
		res.status(400).send({
			status: 'error',
			message: 'Did not delete. The group was not found, or it does not belong to you.'
		});
	}
});

router.get('/all', async (req, res) => {
	let groups = await GetAllUserGroups(req.userId);
	res.status(200).send({
		status: 'success',
		groups: groups,
		results: groups.length
	});
});

router.get('/containingMe', async (req, res) => {
	let groups = await GetGroupsContainingMe(req.userId);
	res.status(200).send({
		status: 'success',
		groups: groups,
		results: groups.length
	});
});

router.get('/:id', async (req, res) => {
	let groupId = req.params.id;
	if (!ObjectId.isValid(groupId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Group id is not a valid id'
		});

	let group = await GetGroupById(groupId, req.userId);

	if (!group)
		return res.status(400).send({
			status: 'error',
			message: "Group not found. Either the id is incorrect, or the group doesn't belong to you."
		});

	res.status(200).send({
		status: 'success',
		group: group
	});
});

export default router;
