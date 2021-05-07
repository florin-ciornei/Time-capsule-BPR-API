import * as express from 'express';
import GroupModel, { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from "../schemas/notificationSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';

const router = express.Router();

/**
 * Get all tags.
 */
router.get("/", async (req, res) => {
	const resultsPerPage = 20;
	let page = parseInt(req.query.page as string);
	if (isNaN(page)) page = 0;

	let notifications = await NotificationModel.find({ toUser: req.userId })
		.populate("toUser", "_id name profilePictureUrl")
		.populate("byUser", "_id name profilePictureUrl")
		.populate("group", "_id name")
		.populate("timeCapsule", "_id name openData description backgroundType")
		.sort({ time: -1 })
		.skip(page * resultsPerPage)
		.limit(resultsPerPage)
		.lean();

	res.json({
		status: "success",
		results: notifications.length,
		notifications: notifications,
	});
});

export default router;