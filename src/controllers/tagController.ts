import * as express from 'express';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';

const router = express.Router();

/**
 * Get all tags.
 */
router.get("/all", async (req, res) => {
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags" } }
	]);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
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
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags", usages: { $sum: 1 } } },
		{ $sort: { usages: -1 } }
	]).limit(20);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
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
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags" } },
		{ $match: { _id: { '$regex': query, '$options': 'i' } } }
	]).limit(20);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
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
router.put("/saveTags", async (req, res) => {
	let tags = req.body.tags;
	let userId = req.userId;

	// Removes emty strings from the list of tags!
	let cleanTags = tags.filter(Boolean);
	
	// If emty it then clears the list of preffered tags!
	if (cleanTags) {
		await UserModel.updateOne(
			{ _id: userId },
			{ $set: { prefferedTags: cleanTags } });

		res.status(200).send({
			status: 'success',
			message: "The tags have been added to the user's list of prefferences!"
		});
	} else {
		return res.status(400).send({
			status: "error",
			message: "The list of provided tags is emty, no tags have been added!"
		});

	}
});

export default router;