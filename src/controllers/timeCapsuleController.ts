import * as express from 'express';
import firebase from '../services/firebase';
import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import * as multer from 'multer';

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
	let allowedGroups: string[] = req.body.allowedUsers;
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
router.delete("/:id", async (req, res) => {

});

/**
 * Get a lean list with my time capsules (without contets, just the metadata)
 */
router.get("/my", async (req, res) => {

});

/**
 * Get specific time capsule by its ID.
 */
router.get("/:id", async (req, res) => {

});

export default router;