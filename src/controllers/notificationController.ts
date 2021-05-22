import * as express from 'express';
import GroupModel, { Group } from '../schemas/groupSchema';
import NotificationModel, { Notification } from "../schemas/notificationSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import * as NotificationService from '../services/notificationService';

const router = express.Router();

/**
 * Get all tags.
 */
router.get("/", async (req, res) => {

	let notifications =	NotificationService.GetAllNotificationsService(req);

	res.json({
		status: "success",
		results: notifications.length,
		notifications: notifications,
	});
});

export default router;