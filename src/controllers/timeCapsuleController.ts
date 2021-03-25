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
	let currentDate = new Date();
	timeCapsules = timeCapsules.map(timeCapsule => {
		if (timeCapsule.openDate > currentDate) {
			timeCapsule.isOpened = false;
			delete timeCapsule.contents;
		} else {
			timeCapsule.isOpened = true;
		}
		return timeCapsule;
	});
	res.status(200).send({
		status: "success",
		results: timeCapsules.length,
		timeCapsules: timeCapsules,
	});
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

	let timeCapsule = await TimeCapsuleModel.findOne({ _id: timeCapsuleID, owner: ownerID })
		.select("-__v -owner").lean();

	if (!timeCapsule)
		return res.status(400).send({
			status: "error",
			message: "Time capsule not found. Either the id is incorrect," +
			" or the time capsule doesn't belong to you."
		});

	res.status(200).send({
		status: 'success',
		timeCapsule: timeCapsule
	});

});

export default router;