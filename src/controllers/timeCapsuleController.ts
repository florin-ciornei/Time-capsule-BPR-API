import * as express from 'express';
import * as multer from 'multer';
import * as mongoose from 'mongoose';
import firebase from '../services/firebase';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage()
});

/**
 * Create time capsule
 */
router.post("/", upload.array("contents"), async (req, res) => {
	let name: string = req.body.name;
	let description: string = req.body.description;
	let openDate: Date = req.body.openDate;
	let isPrivate: boolean = req.body.isPrivate;
	let tags: string[] = req.body.tags;
	let allowedUsers: string[] = req.body.allowedUsers;
	let allowedGroups: string[] = req.body.allowedGroups;
	let location: { lat: number, lon: number } = { lat: req.body.lat, lon: req.body.lon };
	let backgroundType: number = req.body.backgroundType;
	//TODO validate fields

	// Converts all tags to lower case before saving them 
	// ans storing the time capsule in the database
	tags.forEach((tag, index) => {
		tags[index] = tag.toLowerCase();
	});

	//create the time capsule
	let timeCapsule = await TimeCapsuleModel.create({
		name: name,
		description: description,
		openDate: openDate,
		createDate: new Date(),
		isPrivate: isPrivate,
		tags: tags,
		allowedUsers: allowedUsers,
		allowedGroups: allowedGroups,
		owner: req.userId,
		location: location,
		backgroundType: backgroundType
	});


	//upload the files and set them in the time capsule, and save the time capsule with the new contents
	let contents: { url: string, mimeType: string }[] = [];
	for (let i = 0; i < req.files.length; i++) {
		let file = req.files[i];
		let fileUrl = await firebase.uploadFileToBucket(file, timeCapsule._id, i + "");
		contents.push({
			url: fileUrl,
			mimeType: file.mimetype
		})
	}
	timeCapsule.contents = contents;
	await timeCapsule.save();


	res.status(200).send({
		status: 'success',
		message: 'Time capsule created!',
		timeCapsule: timeCapsule
	});
});


/**
 * Update accessibility perimissions for a time capsule.
 */
router.put("/:id", async (req, res) => {
	let timeCapsuleID = req.params.id;
	let ownerID = req.userId;
	let name: string = req.body.name;
	let allowedUsers: string[] = req.body.allowedUsers;
	let allowedGroups: string[] = req.body.allowedGroups;


	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: "error",
			message: "Time capsule id is not a valid id"
		});

	let timeCapsule = await TimeCapsuleModel.findOneAndUpdate(
		{ _id: timeCapsuleID, owner: ownerID },
		{ name: name, allowedUsers: allowedUsers, allowedGroups: allowedGroups },
		{ new: true });

	res.status(200).send({
		status: 'success',
		message: 'Time capsule updated!',
		timeCapsule: timeCapsule
	});

});

/**
 * Delete time capsule.
 */
router.delete("/delete/:id", async (req, res) => {
	let timeCapsuleID = req.params.id;
	let ownerID = req.userId;

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: "error",
			message: "Time capsule id is not a valid id"
		});

	let result = await TimeCapsuleModel.deleteOne({ _id: timeCapsuleID, owner: ownerID });
	if (result.n === 1) {
		res.status(200).send({
			status: 'success',
			message: 'Time capsule deleted!',
		});
	} else {
		res.status(400).send({
			status: 'error',
			message: 'Did not delete. The time capsule was not found, or it does not belong to you.',
		});
	}
});

/**
 * Get a lean list with my time capsules.
 */
router.get("/my", async (req, res) => {
	let timeCapsules = await TimeCapsuleModel.find({ owner: req.userId }).lean();
	timeCapsules = timeCapsules.map(timeCapsule => parseTimeCapsule(timeCapsule as TimeCapsule, req.userId, false));
	res.status(200).send({
		status: "success",
		results: timeCapsules.length,
		timeCapsules: timeCapsules,
	});
});

/**
 * Get a lean list with the time capsules of a user.
 */
router.get("/user/:userId", async (req, res) => {
	let myGroups = await GroupModel.find({ users: req.userId }).lean();
	let myGroupIds = myGroups.map(g => g._id);

	let timeCapsules = await TimeCapsuleModel.find({
		owner: req.params.userId, isPrivate: false, $or: [
			// capsules that don't have allowedGroups or allowedUsers can be seen by anyone
			{
				allowedGroups: [],
				allowedUsers: []
			},
			// or the capsules in which you are included as an allowed user
			{ allowedUsers: req.userId },
			// or the capsules that are shared with a group in which you are included
			{ allowedGroups: { $in: myGroupIds } }
		]
	}).lean();

	timeCapsules = timeCapsules.map(timeCapsule => parseTimeCapsule(timeCapsule as TimeCapsule, req.userId, false));
	res.status(200).send({
		status: "success",
		results: timeCapsules.length,
		timeCapsules: timeCapsules,
	});
});


/**
 * Get all time capsules that I am subscribed to.
 */
router.get("/subscribed", async (req, res) => {
	let ownerID = req.userId;
	let subscribedCapsules = await TimeCapsuleModel.find({ subscribedUsers: ownerID }).lean();

	if (!subscribedCapsules)
		return res.status(400).send({
			status: "error",
			message: "There are no time capsules. " +
				"You haven't subscribed to any time capsules yet."
		});

	subscribedCapsules = subscribedCapsules.map(timeCapsule => parseTimeCapsule(timeCapsule as TimeCapsule, req.userId, false));

	res.status(200).send({
		status: 'success',
		subscribedCapsules: subscribedCapsules
	});

});

/**
 * Seach time capsules by tags, content, keywords contained in description or name, open/closed and opening date/time.
 */
router.get("/search", async (req, res) => {
	let tags: string[] = req.body.tags;
	let contents = req.body.contents;
	let keywords = req.body.keywords;
	let open_closed = req.body.open_closed;
	let opening_date_from = req.body.opening_date_from;
	let opening_date_to = req.body.opening_date_to;
	let capsulesFound = [];
	let filter: { [k: string]: any } = {};

	if (tags) {
		tags.forEach((tag, index) => {
			tags[index] = tag.toLowerCase();
		});
		filter.tags = { $in: tags };
	}

	if (contents) {
		filter["contents.mimeType"] = contents;
	}

	if (keywords) {
		let filterKeywords = {
			'$or': [{ name: { '$regex': keywords, '$options': 'i' } },
			{ description: { '$regex': keywords, '$options': 'i' } }
			]
		};
		filter = { ...filter, ...filterKeywords };
	}

	if (open_closed) {
		let currentDate = new Date();
		if (open_closed == "open") {
			filter.openDate = { $lte: currentDate };
		} else if (open_closed == "closed") {
			filter.openDate = { $gt: currentDate };
		}
	}

	if (opening_date_from || opening_date_to) {
		if (opening_date_from && opening_date_to) {
			let opening_date = {
				'$and': [
					{ openDate: { '$gte': opening_date_from } },
					{ openDate: { '$lte': opening_date_to } }
				]
			};
			filter = { ...filter, ...opening_date };
		} else if (opening_date_from) {
			let opening_date = { openDate: { '$gte': opening_date_from } };
			filter = { ...filter, ...opening_date };
		} else if (opening_date_to) {
			let opening_date = { openDate: { '$lte': opening_date_to } };
			filter = { ...filter, ...opening_date };
		}
	}

	capsulesFound = await TimeCapsuleModel.find(filter).lean();
	capsulesFound = capsulesFound.map(timeCapsule => parseTimeCapsule(timeCapsule as TimeCapsule, req.userId, false));

	res.status(200).send({
		status: "success",
		timeCapsules: capsulesFound
	});
});

/**
 * Subscribe / Unsubscribe.
 */
router.get("/:id/toggleSubscription", async (req, res) => {
	let timeCapsuleID = req.params.id;

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: "error",
			message: "Time capsule id is not a valid id"
		});

	let timeCapsule = await TimeCapsuleModel.findById(timeCapsuleID).lean();

	if (!timeCapsule)
		return res.status(404).send({
			status: "error",
			message: "Time capsule with this id doesn't exist."
		});

	if (timeCapsule.subscribedUsers && timeCapsule.subscribedUsers.includes(req.userId)) {
		await TimeCapsuleModel.findByIdAndUpdate(timeCapsuleID, { $pull: { subscribedUsers: req.userId } });
		res.status(200).send({
			status: "success",
			toggleAction: "unsubscribed"
		});
	} else {
		await TimeCapsuleModel.findByIdAndUpdate(timeCapsuleID, { $push: { subscribedUsers: req.userId } });
		res.status(200).send({
			status: "success",
			toggleAction: "subscribed"
		});
	}

	res.send(200);
});

enum Reaction {
	LIKE = "like", LOVE = "love", HAHA = "haha", WOW = "wow", SAD = "sad",
	ANGRY = "angry"
}

/**
 * Add / remove reaction to time capsule.
 */
router.get("/:id/react/:reaction", async (req, res) => {
	let timeCapsuleID = req.params.id;
	let reaction = req.params.reaction;

	let reactionAllowedValues = Object.keys(Reaction).map(k => Reaction[k]);
	reactionAllowedValues.push("remove");

	if (!reactionAllowedValues.includes(reaction))
		return res.status(400).send({
			status: "error",
			message: "This is not an allowed value for the 'reaction' parameter. " +
				"Please use only remove, like, love, laugh, compassion, startled, crying, sad."
		});

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: "error",
			message: "Time capsule id is not a valid id"
		});

	let timeCapsule = await TimeCapsuleModel.findById(timeCapsuleID).lean();

	if (!timeCapsule)
		return res.status(404).send({
			status: "error",
			message: "Time capsule with this id doesn't exist."
		});

	if (reaction == "remove") {
		// remove user reactions
		await TimeCapsuleModel.findByIdAndUpdate(timeCapsuleID, { $pull: { reactions: { userId: req.userId } } }, { multi: true });
		return res.status(200).send({
			status: "success",
			message: "Reaction removed"
		});
	} else {
		// add reaction
		await TimeCapsuleModel.findByIdAndUpdate(timeCapsuleID, { $pull: { reactions: { userId: req.userId } } }, { multi: true });// remove other reactions if they are present
		await TimeCapsuleModel.findByIdAndUpdate(timeCapsuleID, { $push: { reactions: { reaction: reaction, userId: req.userId } } });
		return res.status(200).send({
			status: "success",
			message: "Reaction added"
		});
	}
});

/**
 * Get specific time capsule by its ID.
 */
router.get("/:id", async (req, res) => {
	let timeCapsuleID = req.params.id;
	let ownerID = req.userId;

	if (!ObjectId.isValid(timeCapsuleID))
		return res.status(400).send({
			status: "error",
			message: "Time capsule id is not a valid id"
		});

	let timeCapsule = await TimeCapsuleModel.findOne({ _id: timeCapsuleID, owner: ownerID }).lean();

	if (!timeCapsule)
		return res.status(400).send({
			status: "error",
			message: "Time capsule not found. Either the id is incorrect," +
				" or the time capsule doesn't belong to you."
		});

	res.status(200).send({
		status: 'success',
		timeCapsule: parseTimeCapsule(timeCapsule as TimeCapsule, req.userId, false)
	});

});

/**
 * Does some parsing on the time capsule:
 * 1. Detect if the user is subscribed
 * 2. Parse how many reactions does the time capsule have
 * 3. Detect my reaction to this time capsule
 * 4. Detect if the time capsule is opened
 * @param removePrivateData if we need to remove allowed users, allowed groups and other private data to which only the owner has access
 */
const parseTimeCapsule = (timeCapsule: TimeCapsule, requestingUserId: string, removePrivateData: boolean) => {
	// 1. check if the user is subscribed
	if (timeCapsule.subscribedUsers)
		timeCapsule.isSubscribed = timeCapsule.subscribedUsers.includes(requestingUserId);
	else
		timeCapsule.isSubscribed = false;

	// 2. fill the reactionsLean with values
	timeCapsule.reactionsLean = Object.keys(Reaction)
		.map(k => Reaction[k])
		.map(reaction => ({ reaction: reaction, count: timeCapsule.reactions ? timeCapsule.reactions.filter(r => r.reaction === reaction).length : 0 }));

	// 3. detect my reaction to this time capsule
	if (timeCapsule.reactions) {
		let filtered = timeCapsule.reactions.filter(r => r.userId === requestingUserId);
		timeCapsule.myReaction = filtered[0] ? filtered[0].reaction : "";
	} else {
		timeCapsule.myReaction = "";
	}

	// 4. detect if time capsule is opened
	let currentDate = new Date();
	if (timeCapsule.openDate > currentDate) {
		timeCapsule.isOpened = false;
		delete timeCapsule.contents;
	} else {
		timeCapsule.isOpened = true;
	}

	// these field don't need to be sent to the client
	delete timeCapsule.subscribedUsers;
	delete timeCapsule.reactions;

	return timeCapsule;
}

export default router;