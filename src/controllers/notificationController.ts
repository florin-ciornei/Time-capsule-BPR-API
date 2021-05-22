import * as express from 'express';
import { requireAuth } from '../routers/authRouters';
import { GetUserNotifications } from '../services/notificationService';
const router = express.Router();

/**
 * Get all notifications for a user.
 */
router.get("/", requireAuth, async (req, res) => {
	const resultsPerPage = 20;
	let page = parseInt(req.query.page as string);
	if (isNaN(page)) page = 0;

	let notifications = await GetUserNotifications(page, resultsPerPage, req.userId);

	res.json({
		status: "success",
		results: notifications.length,
		notifications: notifications,
	});
});

export default router;