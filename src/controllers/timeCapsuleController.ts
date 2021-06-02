import * as express from 'express';
import * as multer from 'multer';
import * as mongoose from 'mongoose';
import { SendAddedToAllowedUsersNotifications, SendSubScribeToTimeCapsuleNotification } from '../services/notificationService';
import {
	CreateTimeCapsule,
	DeleteTimeCapsule,
	GetFeed,
	GetMyTimeCapsules,
	GetPublicFeed,
	GetSearchTimeCapsules,
	ToggleReaction,
	GetSubcribedTimeCapsules,
	GetTimeCapsuleById,
	GetTimeCapsuleByIdAndUserId,
	GetUsersTimeCapsules,
	LeaveAllowedUsers,
	Reaction,
	ToggleSubscribedUser,
	UpdateTimeCapsule
} from '../services/timeCapsuleService';
import { requireAuth } from '../routers/authRouters';

const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage()
});

/**
 * Create time capsule
 */
router.post('/', requireAuth, upload.array('contents'), async (req, res) => {
	let name: string = req.body.name;
	let description: string = req.body.description;
	let openDate: Date = new Date(req.body.openDate);
	let isPrivate: boolean = req.body.isPrivate;
	let tags: string[] = req.body.tags;
	let allowedUsers: string[] = req.body.allowedUsers;
	let allowedGroups: string[] = req.body.allowedGroups;
	let location: { lat: number; lon: number } = {
		lat: req.body.lat,
		lon: req.body.lon
	};
	let backgroundType: number = req.body.backgroundType;

	// if there is a single value in arrays it comes as string
	if (typeof tags === 'string') tags = [tags];
	if (typeof allowedUsers === 'string') allowedUsers = [allowedUsers];
	if (typeof allowedGroups === 'string') allowedGroups = [allowedGroups];

	// if the user did not select any background
	if (isNaN(backgroundType)) {
		backgroundType = 4;
	}

	// while testing allow creating capsules with a past date
	// if (process.env.NODE_ENV != 'test' && process.env.NODE_ENV != 'dev' && openDate < new Date()) {
	// 	return res.status(400).send({
	// 		status: 'error',
	// 		code: 'invalid_open_data',
	// 		message: 'Open date must be in the future!'
	// 	});
	// }

	if (name.length < 3 || name.length > 32) {
		return res.status(400).send({
			status: 'error',
			code: 'name_length_out_of_bounds',
			message: 'The time capsule name should have 3-32 characters.'
		});
	}

	if (description.length > 1000) {
		return res.status(400).send({
			status: 'error',
			code: 'description_length_out_of_bounds',
			message: 'The time capsule description should have max 1000 characters.'
		});
	}

	if (req.files.length > 20) {
		return res.status(400).send({
			status: 'error',
			code: 'contents_length_out_of_bounds',
			message: 'A capsule cannot contain more than 20 files.'
		});
	}

	for (let i = 0; i < req.files.length; i++) {
		if (req.files[i].size > 500000000) {
			return res.status(400).send({
				status: 'error',
				code: 'file_too_big',
				message: 'A file cannot have more than 500mb.'
			});
		}
	}

	if (tags && tags.length > 5) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_tags',
			message: 'The time capsule should contain maximum 5 tags.'
		});
	}

	if (allowedUsers && allowedUsers.length > 100) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_allowed_users',
			message: 'The time capsule cannot have more than 100 allowed users.'
		});
	}

	if (allowedGroups && allowedGroups.length > 10) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_groups',
			message: 'The time capsule cannot have more than 10 groups.'
		});
	}

	let timeCapsule = await CreateTimeCapsule(tags, name, openDate, description, isPrivate, allowedUsers, allowedGroups, req.userId, location, backgroundType, req.files as Express.Multer.File[]);

	res.status(200).send({
		status: 'success',
		message: 'Time capsule created!',
		timeCapsule: timeCapsule
	});
});

router.put('/leaveAllowedUsers/:capsuleId', requireAuth, async (req, res) => {
	let capsuleId = req.params.capsuleId;
	if (!ObjectId.isValid(capsuleId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Time capsule id is not a valid id'
		});
	await LeaveAllowedUsers(capsuleId, req.userId);
	res.status(200).send({
		status: 'success',
		message: 'User was removed from the allowed users, the notification was deleted!'
	});
});

/**
 * Update accessibility perimissions for a time capsule.
 */
router.put('/:id', requireAuth, async (req, res) => {
	let capsuleId = req.params.id;
	let ownerId = req.userId;
	let name: string = req.body.name;
	let allowedUsers: string[] = req.body.allowedUsers;
	let allowedGroups: string[] = req.body.allowedGroups;

	// if there is a single value in arrays it comes as string
	if (typeof allowedUsers === 'string') allowedUsers = [allowedUsers];
	if (typeof allowedGroups === 'string') allowedGroups = [allowedGroups];

	if (!ObjectId.isValid(capsuleId))
		return res.status(400).send({
			status: 'error',
			code: 'invalid_id',
			message: 'Time capsule id is not a valid id'
		});

	if (name.length < 3 || name.length > 32) {
		return res.status(400).send({
			status: 'error',
			code: 'name_length_out_of_bounds',
			message: 'The time capsule name should have 3-32 characters.'
		});
	}

	if (allowedUsers && allowedUsers.length > 100) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_allowed_users',
			message: 'The time capsule cannot have more than 100 allowed users.'
		});
	}

	if (allowedGroups && allowedGroups.length > 10) {
		return res.status(400).send({
			status: 'error',
			code: 'too_many_groups',
			message: 'The time capsule cannot have more than 10 groups.'
		});
	}

	let timeCapsule = await UpdateTimeCapsule(capsuleId, ownerId, name, allowedUsers, allowedGroups);
	res.status(200).send({
		status: 'success',
		message: 'Time capsule updated!',
		timeCapsule: timeCapsule
	});
});

/**
 * Delete time capsule.
 */
router.delete('/delete/:id', requireAuth, async (req, res) => {
	let timeCapsuleID = req.params.id;
	let ownerID = req.userId;

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: 'error',
			message: 'Time capsule id is not a valid id'
		});

	let result = await DeleteTimeCapsule(timeCapsuleID, ownerID);
	if (result) {
		res.status(200).send({
			status: 'success',
			message: 'Time capsule deleted!'
		});
	} else {
		res.status(400).send({
			status: 'error',
			message: 'Did not delete. The time capsule was not found, or it does not belong to you.'
		});
	}
});

/**
 * Get a lean list with my time capsules.
 */
router.get('/my', requireAuth, async (req, res) => {
	let timeCapsules = await GetMyTimeCapsules(req.userId);
	res.status(200).send({
		status: 'success',
		results: timeCapsules.length,
		timeCapsules: timeCapsules
	});
});

/**
 * Get a lean list with the time capsules of a user.
 */
router.get('/user/:userId', async (req, res) => {
	let timeCapsules = await GetUsersTimeCapsules(req.params.userId, req.userId);
	res.status(200).send({
		status: 'success',
		results: timeCapsules.length,
		timeCapsules: timeCapsules
	});
});

/**
 * Get a lean list with the feed for the authneticated user.
 */
router.get('/feed', requireAuth, async (req, res) => {
	const resultsPerPage = 20;
	let page = parseInt(req.query.page as string);
	if (isNaN(page)) page = 0;
	let status = req.query.status as string;
	let timeCapsules = await GetFeed(req.userId, page, resultsPerPage, status);
	res.status(200).send({
		status: 'success',
		results: timeCapsules.length,
		timeCapsules: timeCapsules
	});
});

/**
 * Get a lean list with a public feed.
 */
router.get('/publicFeed', async (req, res) => {
	const resultsPerPage = 20;
	let page = parseInt(req.query.page as string);
	if (isNaN(page)) page = 0;
	let status = req.query.status as string;
	let timeCapsules = await GetPublicFeed(status, page, resultsPerPage);
	res.status(200).send({
		status: 'success',
		results: timeCapsules.length,
		timeCapsules: timeCapsules
	});
});

/**
 * Get all time capsules that I am subscribed to.
 */
router.get('/subscribed', requireAuth, async (req, res) => {
	let ownerID = req.userId;
	let subscribedCapsules = await GetSubcribedTimeCapsules(ownerID);
	res.status(200).send({
		status: 'success',
		results: subscribedCapsules.length,
		subscribedCapsules: subscribedCapsules
	});
});

/**
 * Seach time capsules by tags, content, keywords contained in description or name, open/closed and opening date/time.
 */
router.post('/search', async (req, res) => {
	let keyword = req.body.keyword as string;
	let searchInTags = req.body.search_in_tags;
	let searchInName = req.body.search_in_name;
	let searchInDescription = req.body.search_in_description;
	let contents = req.body.contents;
	let open_closed = req.body.open_closed;
	let opening_date_from = req.body.opening_date_from;
	let opening_date_to = req.body.opening_date_to;

	let timeCapsules = await GetSearchTimeCapsules(req.userId, keyword, searchInTags, searchInName, searchInDescription, contents, open_closed, opening_date_from, opening_date_to);

	res.status(200).send({
		status: 'success',
		results: timeCapsules.length,
		timeCapsules: timeCapsules
	});
});

/**
 * Subscribe / Unsubscribe.
 */
router.get('/:id/toggleSubscription', requireAuth, async (req, res) => {
	let timeCapsuleID = req.params.id;
	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: 'error',
			message: 'Time capsule id is not a valid id'
		});

	let timeCapsule = await GetTimeCapsuleById(timeCapsuleID);

	if (!timeCapsule) {
		return res.status(404).send({
			status: 'error',
			message: "Time capsule with this id doesn't exist."
		});
	}

	if (Array.isArray(timeCapsule.subscribedUsers) && timeCapsule.subscribedUsers.includes(req.userId)) {
		ToggleSubscribedUser(timeCapsuleID, req.userId, false);
		res.status(200).send({
			status: 'success',
			toggleAction: 'unsubscribed'
		});
	} else {
		ToggleSubscribedUser(timeCapsuleID, req.userId, true);
		SendSubScribeToTimeCapsuleNotification(timeCapsuleID, req.userId);
		res.status(200).send({
			status: 'success',
			toggleAction: 'subscribed'
		});
	}
});

/**
 * Add / remove reaction to time capsule.
 */
router.get('/:id/react/:reaction', requireAuth, async (req, res) => {
	let timeCapsuleID = req.params.id;
	let reaction = req.params.reaction;

	let reactionAllowedValues = Object.keys(Reaction).map((k) => Reaction[k]);
	reactionAllowedValues.push('remove');

	if (!reactionAllowedValues.includes(reaction))
		return res.status(400).send({
			status: 'error',
			message: "This is not an allowed value for the 'reaction' parameter. " + 'Please use only remove, like, love, haha, wow, sad, angry.'
		});

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: 'error',
			message: 'Time capsule id is not a valid id'
		});

	let timeCapsule = await GetTimeCapsuleById(timeCapsuleID);

	if (!timeCapsule)
		return res.status(404).send({
			status: 'error',
			message: "Time capsule with this id doesn't exist."
		});

	if (reaction == 'remove') {
		// remove user reactions
		await ToggleReaction(timeCapsuleID, req.userId, reaction);
		return res.status(200).send({
			status: 'success',
			message: 'Reaction removed'
		});
	} else {
		// add reaction
		await ToggleReaction(timeCapsuleID, req.userId, reaction);
		return res.status(200).send({
			status: 'success',
			message: 'Reaction added'
		});
	}
});

/**
 * Get specific time capsule by its ID.
 */
router.get('/:id', async (req, res) => {
	let timeCapsuleID = req.params.id;
	let requestingUserId = req.userId;

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: 'error',
			message: 'Time capsule id is not a valid id'
		});

	let timeCapsule = await GetTimeCapsuleByIdAndUserId(timeCapsuleID, requestingUserId);
	if (!timeCapsule)
		return res.status(400).send({
			status: 'error',
			message: 'Time capsule not found. Either the id is incorrect,' + " or the time capsule doesn't belong to you."
		});

	res.status(200).send({
		status: 'success',
		message: 'Time capsule by ID!',
		timeCapsule: timeCapsule
	});
});

export default router;
