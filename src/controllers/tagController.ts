import * as express from 'express';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';

const router = express.Router();

/**
 * Get tag suggestions
 */
router.get("/suggestions/:query", async (req, res) => {

});

export default router;