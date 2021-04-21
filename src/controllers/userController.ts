import * as express from 'express';
import UserModel, { User } from "../schemas/userSchema";

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
            message: 'There is already a user with such an id.',
        });
    }

    await UserModel.create({
        _id: req.userId,
        name: user.name,
        email: user.email,
    });
    res.status(200).send({
        status: 'success',
        message: 'User registered!',
    });
});

router.get("/search/:query", async (req, res) => {
    let query: string = req.params.query;
    let users = await UserModel.find({ name: { "$regex": query, "$options": "i" } }).lean();
    res.status(200).send({
        status: 'success',
        users: users,
        results: users.length
    })
});

/**
 * Get profile data for a user.
 */
router.get("/:id", async (req, res) => {
    let user = await UserModel.findById(req.params.id).lean();

    if (!user) {
        return res.status(200).send({
            status: 'error',
            code: "user_not_found",
            message: "A user with this ID was not found."
        });
    }

    user.isFollowedByMe = user.followedByUsers.includes(req.userId);

    // no need to send these fields to the client
    delete user.followedByUsers;
    delete user.email;

    res.status(200).send({
        status: 'success',
        user: user
    });
});

export default router;
