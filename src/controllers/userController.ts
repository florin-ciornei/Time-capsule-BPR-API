import * as express from 'express';
import * as multer from 'multer';
import {
	CheckUserIdInUse,
	CreateUserAccount,
	DeleteProfilePicture,
	DeleteUserProfile,
	GetMyProfile,
	GetRawUser,
	GetUserProfile,
	SearchUsers,
	ToggleFollow,
	UpdateProfilePicture,
	UpdateUser
} from '../services/userService';
import { requireAuth } from '../routers/authRouters';

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage()
});

/**
 * Register a new user.
 */
router.post('/register', requireAuth, async (req, res) => {
	let email = req.body.email as string;
	let name = req.body.name as string;

	//check for existing user
	let userExists = await CheckUserIdInUse(req.userId);
	if (userExists) {
		return res.status(400).send({
			status: 'error',
			code: 'existing_id',
			message: 'There is already a user with such an id.'
		});
	}

	const user = await CreateUserAccount(req.userId, email, name);

	res.status(200).send({
		status: 'success',
		message: 'User registered!',
		user: user
	});
});

router.get('/search/:query', async (req, res) => {
	let query: string = req.params.query;
	let users = await SearchUsers(query, req.userId);
	res.status(200).send({
		status: 'success',
		users: users,
		results: users.length
	});
});

/**
 * Get profile data for my account.
 */
router.get('/me', requireAuth, async (req, res) => {
	let profile = await GetMyProfile(req.userId);

	if (!profile) {
		return res.status(400).send({
			status: 'error',
			code: 'user_not_found',
			message: 'Couldnt retrieve your preProcessFile, user with this id not found'
		});
	}

	res.status(200).send({
		status: 'success',
		user: profile
	});
});

/**
 * Get profile data for a user.
 */
router.get('/:id', async (req, res) => {
	let profile = await GetUserProfile(req.params.id as string, req.userId);

	if (!profile) {
		return res.status(404).send({
			status: 'error',
			code: 'user_not_found',
			message: 'A user with this ID was not found.'
		});
	}

	res.status(200).send({
		status: 'success',
		user: profile
	});
});

/**
 *  Follow / Unfollow another user.
 */
router.put('/followUnfollow/:id', requireAuth, async (req, res) => {
	let follower = req.userId;
	let followedUserID = req.params.id;
	let followedUser = await GetRawUser(followedUserID);

	if (!followedUser) {
		return res.status(200).send({
			status: 'error',
			code: 'user_not_found',
			message: 'There is no user with this ID!'
		});
	}

	let isFollowed = followedUser.followedByUsers ? followedUser.followedByUsers.includes(follower) : false;

	if (isFollowed) {
		await ToggleFollow(followedUserID, follower, true);
		res.status(200).send({
			status: 'success',
			message: 'User was successfully unfollowed!'
		});
	} else {
		await ToggleFollow(followedUserID, follower, true);
		res.status(200).send({
			status: 'success',
			message: 'User was successfully followed!'
		});
	}
});

/**
 * Update user data.
 */
router.put('/', requireAuth, async (req, res) => {
	await UpdateUser(req.userId, req.body.name);
	res.status(200).send({
		status: 'success',
		message: 'User data updated!'
	});
});

/**
 * Delete user profile.
 */
router.delete('/', requireAuth, async (req, res) => {
	await DeleteUserProfile(req.userId);
	res.status(200).send({
		status: 'success',
		message: 'User profile deleted!'
	});
});

/**
 * Change profile picture.
 */
router.put('/profileImage', requireAuth, upload.single('image'), async (req, res) => {
	let fileUrl = await UpdateProfilePicture(req.userId, req.file);
	res.status(200).send({
		status: 'success',
		message: 'Profile image changed!',
		imageUrl: fileUrl
	});
});

/**
 * Delete profile picture (client will display a default profile picture)
 */
router.delete('/profileImage', requireAuth, async (req, res) => {
	await DeleteProfilePicture(req.userId);
	res.status(200).send({
		status: 'success',
		message: 'Profile image deleted!'
	});
});

export default router;
