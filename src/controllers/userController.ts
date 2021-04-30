import * as express from 'express';
import UserModel, { User } from '../schemas/userSchema';

const router = express.Router();

/**
 * @api {get} /user/:id Register user
 * @apiGroup User
 *
 * @apiHeader {String} Authorization Must contain the Firebase token.
 * @apiParam {String} name Name of the user.
 * @apiParam {String} email Email of the user.
 *
 * @apiError (Error 400) existing_id There is already a user with such an id.
 */
router.post('/register', async (req, res) => {
	let user = req.body;

	//check for existing user
	let existingUser = await UserModel.findById(req.userId).lean();
	if (existingUser) {
		return res.status(400).send({
			status: 'error',
			code: 'existing_id',
			message: 'There is already a user with such an id.'
		});
	}

	await UserModel.create({
		_id: req.userId,
		name: user.name,
		email: user.email
	});
	res.status(200).send({
		status: 'success',
		message: 'User registered!'
	});
});

router.get('/search/:query', async (req, res) => {
	let query: string = req.params.query;
	let users = await UserModel.find({ name: { $regex: query, $options: 'i' } }).lean();
	res.status(200).send({
		status: 'success',
		users: users,
		results: users.length
	});
});

/**
 * Get profile data for a user.
 */
router.get('/:id', async (req, res) => {
	let user = await UserModel.findById(req.params.id).lean();

	if (!user) {
		return res.status(400).send({
			status: 'error',
			code: 'user_not_found',
			message: 'A user with this ID was not found.'
		});
	}

	user.isFollowedByMe = user.followedByUsers ? user.followedByUsers.includes(req.userId) : false;
	user.followersCount = user.followedByUsers ? user.followedByUsers.length : 0;
	user.followingCount = user.followingUsers ? user.followingUsers.length : 0;

	// no need to send these fields to the client
	delete user.followedByUsers;
	delete user.followingUsers;
	delete user.email;

	res.status(200).send({
		status: 'success',
		user: user
	});
});

/**
 *  Follow / Unfollow another user.
 */
router.put('/followUnfollow/:id', async (req, res) => {
	let follower = req.userId;
	let followedUserID = req.params.id;

	// if (!ObjectId.isValid(followedUserID))
	// 	return res.status(400).send({
	// 		status: "error",
	// 		message: "User ID is not a valid ID!"
	// 	});

	let followedUser = await UserModel.findById(followedUserID).lean();

	if (!followedUser) {
		return res.status(200).send({
			status: 'error',
			code: 'user_not_found',
			message: 'There is no user with this ID!'
		});
	}

	let isFollowed = followedUser.followedByUsers ? followedUser.followedByUsers.includes(follower) : false;

	if (isFollowed) {
		await UserModel.updateOne({ _id: followedUserID }, { $pull: { followedByUsers: follower } });
		await UserModel.updateOne({ _id: req.userId }, { $pull: { followingUsers: follower } });

		res.status(200).send({
			status: 'success',
			message: 'User was successfully unfollowed!'
		});
	} else {
		await UserModel.updateOne({ _id: followedUserID }, { $push: { followedByUsers: follower } });
		await UserModel.updateOne({ _id: req.userId }, { $push: { followingUsers: follower } });

		res.status(200).send({
			status: 'success',
			message: 'User was successfully followed!'
		});
	}
});

export default router;
