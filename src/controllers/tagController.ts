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
 * Get tag suggestions.
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

export default router;