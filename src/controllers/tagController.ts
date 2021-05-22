import * as express from 'express';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import { GetAllTags, GetRegisterTagSuggestions, GetTagSuggestions, SavePrefferedTags } from '../services/tagService';
import { requireAuth } from '../routers/authRouters';

const router = express.Router();

/**
 * Get all tags.
 */
router.get("/all", async (req, res) => {
	let tags = await GetAllTags();
	res.json({
		status: "success",
		results: tags.length,
		tags: tags,
	});
});


/**
 * Get tag suggestions for the page where the user can pick interests.
 */
router.get("/registerSuggestions", async (req, res) => {
	let tags = await GetRegisterTagSuggestions();
	res.json({
		status: "success",
		results: tags.length,
		tags: tags,
	});
});


/**
 * Get tag suggestions, when creating a time capsule tag suggestions are displayed when the user is typing.
 */
router.get("/suggestions/:query", async (req, res) => {
	let query = req.params.query;
	let tags = await GetTagSuggestions(query);
	res.json({
		status: "success",
		results: tags.length,
		tags: tags,
	});
});

/**
 *  Save tags preferences for user based on interest, 
 *  to be used for custom tailoring the feed for the user 
 */
router.put("/saveTags", requireAuth, async (req, res) => {
	let tags = req.body.tags as string[];
	let userId = req.userId;
	let cleanTags = tags.filter(Boolean);

	if (cleanTags.length > 50)
		res.status(400).send({
			status: 'error',
			code: "maximum_tags_number_exceeded",
			message: "You provided too many tags"
		});

	await SavePrefferedTags(cleanTags, userId);
	res.status(200).send({
		status: 'success',
		message: "The tags have been added to the user's list of prefferences!"
	});
});

export default router;