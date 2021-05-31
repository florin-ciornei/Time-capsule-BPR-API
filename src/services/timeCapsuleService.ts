import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from '../schemas/userSchema';
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import { SendAddedToAllowedUsersNotifications, SendNewCapsuleCreatedNotifications as SendNewCapsuleCreatedNotificationsToGroups } from './notificationService';
import firebase, { DeleteFile, UploadFileToBucket } from './firebaseService';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import { LeanDocument } from 'mongoose';

export const CreateTimeCapsule = async (
	tags: string[],
	name: string,
	openDate: Date,
	description: string,
	isPrivate: boolean,
	allowedUsers: string[],
	allowedGroups: string[],
	ownerId: string,
	location: any,
	backgroundType: number,
	files: Express.Multer.File[]
): Promise<TimeCapsule> => {
	// convert all tags to lower case before saving them
	if (!tags) tags = [];
	tags.forEach((tag, index) => {
		tags[index] = tag.toLowerCase();
	});

	// create the time capsule
	let timeCapsule = await TimeCapsuleModel.create({
		name: name,
		description: description,
		openDate: openDate,
		createDate: new Date(),
		isPrivate: isPrivate,
		tags: tags,
		allowedUsers: allowedUsers,
		allowedGroups: allowedGroups,
		owner: ownerId,
		location: location,
		backgroundType: backgroundType
	});

	// upload the files and set them in the time capsule, and save the time capsule with the new contents
	let contents: { url: string; mimeType: string }[] = [];
	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		let fileUrl = await UploadFileToBucket(file, `capsuleContents/${timeCapsule._id}`, i + '');
		contents.push({
			url: fileUrl,
			mimeType: file.mimetype
		});
	}
	timeCapsule.contents = contents;
	await timeCapsule.save();

	if (process.env.NODE_ENV != 'test') {
		SendAddedToAllowedUsersNotifications(timeCapsule._id, allowedUsers, ownerId);
		SendNewCapsuleCreatedNotificationsToGroups(timeCapsule._id, ownerId, allowedGroups);
	}

	return timeCapsule;
};

export const LeaveAllowedUsers = async (capsuleId: string, userId: string) => {
	await TimeCapsuleModel.updateOne({ _id: capsuleId }, { $pull: { allowedUsers: userId } });
	await NotificationModel.deleteOne({ toUser: userId, timeCapsule: capsuleId, type: 'addedToAllowedUsers' });
};

export const UpdateTimeCapsule = async (timeCapsuleID: string, ownerID: string, name: string, allowedUsers: string[], allowedGroups: string[]): Promise<TimeCapsule> => {
	let timeCapsule = await TimeCapsuleModel.findOneAndUpdate({ _id: timeCapsuleID, owner: ownerID }, { name: name, allowedUsers: allowedUsers, allowedGroups: allowedGroups }, { new: true });
	if (process.env.NODE_ENV != 'test') {
		SendAddedToAllowedUsersNotifications(timeCapsule._id, allowedUsers, ownerID);
		SendNewCapsuleCreatedNotificationsToGroups(timeCapsule._id, ownerID, allowedGroups);
	}
	return timeCapsule;
};

export const DeleteTimeCapsule = async (capsuleId: string, ownerId: string): Promise<boolean> => {
	const timeCapsule = await TimeCapsuleModel.findById(capsuleId);
	timeCapsule.contents.forEach(async (file) => {
		await DeleteFile(file.url);
	});

	let result = await TimeCapsuleModel.deleteOne({
		_id: capsuleId,
		owner: ownerId
	});
	return result.n == 1;
};

export const GetMyTimeCapsules = async (userId: string): Promise<LeanDocument<TimeCapsule>[]> => {
	let timeCapsules = await TimeCapsuleModel.find({ owner: userId }).populate('owner', 'name').lean();
	timeCapsules = timeCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, userId, false));
	return timeCapsules;
};

export const GetUsersTimeCapsules = async (fromUserId: string, requestingUserId: string): Promise<LeanDocument<TimeCapsule>[]> => {
	// find the ids of the group this user is added to, they are used to select capsules that have these group ids
	let myGroups = await GroupModel.find({ users: requestingUserId }).lean();
	let myGroupIds = myGroups.map((g) => g._id);

	let timeCapsules = await TimeCapsuleModel.find({
		owner: fromUserId,
		isPrivate: false,
		$or: [
			// capsules that don't have allowedGroups or allowedUsers can be seen by anyone
			{
				allowedGroups: [],
				allowedUsers: []
			},
			// or the capsules in which you are included as an allowed user
			{ allowedUsers: requestingUserId },
			// or the capsules that are shared with a group in which you are included
			{ allowedGroups: { $in: myGroupIds } }
		]
	})
		.populate('owner', 'name')
		.lean();

	timeCapsules = timeCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, requestingUserId, false));

	return timeCapsules;
};

export const GetFeed = async (userId: string, page: number, resultsPerPage: number, status: string): Promise<LeanDocument<TimeCapsule>[]> => {
	// find the ids of the group this user is added to, they are used to select capsules that have these group ids
	let myGroups = await GroupModel.find({ users: userId }).lean();
	let myGroupIds = myGroups.map((g) => g._id);

	let usersFollowedByMe = await UserModel.find({
		followedByUsers: userId
	}).lean();
	let usersFollowedByMeIds = usersFollowedByMe.map((u) => u._id);

	let filter = {
		owner: { $in: usersFollowedByMeIds },
		isPrivate: false,
		$or: [
			// capsules that don't have allowedGroups or allowedUsers can be seen by anyone
			{
				allowedGroups: [],
				allowedUsers: []
			},
			// or the capsules in which you are included as an allowed user
			{ allowedUsers: userId },
			// or the capsules that are shared with a group in which you are included
			{ allowedGroups: { $in: myGroupIds } }
		]
	};

	if (status == 'opened') {
		filter['openDate'] = { $lt: new Date() };
	}

	if (status == 'closed') {
		filter['openDate'] = { $gt: new Date() };
	}

	let timeCapsules = await TimeCapsuleModel.find(filter)
		.populate('owner', 'name')
		.sort({ createDate: 'desc' })
		.skip(page * (resultsPerPage - 2))
		.limit(resultsPerPage - 2)
		.lean();
	timeCapsules = timeCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, userId, false));

	// also select 2 random capsules based on user preffered tags
	let prefferedTags = (await UserModel.findById(userId)).prefferedTags;
	let prefferedTagsCapsules = await TimeCapsuleModel.find({
		isPrivate: false,
		$or: [
			// capsules that don't have allowedGroups or allowedUsers can be seen by anyone
			{
				allowedGroups: [],
				allowedUsers: []
			}
		],
		tags: { $in: prefferedTags }
	})
		.sort({ createDate: 'desc' })
		.skip(page * 2)
		.limit(2)
		.lean();
	prefferedTagsCapsules = prefferedTagsCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, userId, false));

	return [...timeCapsules, ...prefferedTagsCapsules];
};

export const GetPublicFeed = async (status: string, page: number, resultsPerPage: number): Promise<LeanDocument<TimeCapsule>[]> => {
	let filter = {
		isPrivate: false,
		allowedGroups: [],
		allowedUsers: []
	};

	if (status == 'opened') {
		filter['openDate'] = { $lt: new Date() };
	}

	if (status == 'closed') {
		filter['openDate'] = { $gt: new Date() };
	}

	let timeCapsules = await TimeCapsuleModel.find(filter)
		.populate('owner', 'name')
		.sort({ createDate: 'desc' })
		.skip(page * resultsPerPage)
		.limit(resultsPerPage)
		.lean();
	timeCapsules = timeCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, undefined, false));
	return timeCapsules;
};

export const GetTimeCapsuleByIdAndUserId = async (timeCapsuleId: string, ownerId: string): Promise<any> => {
	let timeCapsule = await TimeCapsuleModel.findOne({
		_id: timeCapsuleId
	})
		.populate('owner', 'name')
		.lean();
	return parseTimeCapsule(timeCapsule as TimeCapsule, ownerId, false);
};

export const GetSubcribedTimeCapsules = async (userId: string): Promise<TimeCapsule[]> => {
	let subscribedCapsules = await TimeCapsuleModel.find({
		subscribedUsers: userId
	})
		.populate('owner', 'name')
		.lean();
	return subscribedCapsules.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, userId, false));
};

export const GetSearchTimeCapsules = async (
	userId: string,
	keyword: string,
	searchInTags: boolean,
	searchInName: boolean,
	searchInDescription: boolean,
	contents: string,
	open_closed: string,
	opening_date_from: Date,
	opening_date_to: Date
): Promise<TimeCapsule[]> => {
	// find the ids of the group this user is added to, they are used to select capsules that have these group ids
	let myGroups = await GroupModel.find({ users: userId }).lean();
	let myGroupIds = myGroups.map((g) => g._id);

	let filter: { [k: string]: any } = {};

	if (searchInTags) {
		let filterTags = {
			$or: [{ tags: { $regex: keyword, $options: 'i' } }]
		};

		filter = { ...filter, ...filterTags };
	}

	if (searchInName && searchInTags) {
		let filterName = { name: { $regex: keyword, $options: 'i' } };

		filter['$or'].push(filterName);
	} else if (searchInName && !searchInTags) {
		let filterName = {
			$or: [{ name: { $regex: keyword, $options: 'i' } }]
		};
		filter = { ...filter, ...filterName };
	}

	if (searchInDescription && (searchInName || searchInTags)) {
		let filterDescription = { description: { $regex: keyword, $options: 'i' } };

		filter['$or'].push(filterDescription);
	}

	if (contents) {
		filter['contents.mimeType'] = contents;
	}

	if (open_closed) {
		let currentDate = new Date();
		if (open_closed == 'open') {
			filter.openDate = { $lte: currentDate };
		} else if (open_closed == 'closed') {
			filter.openDate = { $gt: currentDate };
		}
	}

	if (opening_date_from || opening_date_to) {
		if (opening_date_from && opening_date_to) {
			let opening_date = {
				$and: [{ openDate: { $gte: opening_date_from } }, { openDate: { $lte: opening_date_to } }]
			};
			filter = { ...filter, ...opening_date };
		} else if (opening_date_from) {
			let opening_date = { openDate: { $gte: opening_date_from } };
			filter = { ...filter, ...opening_date };
		} else if (opening_date_to) {
			let opening_date = { openDate: { $lte: opening_date_to } };
			filter = { ...filter, ...opening_date };
		}
	}

	let capsulesFound = await TimeCapsuleModel.find(filter).populate('owner', 'name').lean();
	return capsulesFound.map((timeCapsule) => parseTimeCapsule(timeCapsule as TimeCapsule, userId, false));
};

export const GetTimeCapsuleById = async (capsuleId: string): Promise<any> => {
	return await TimeCapsuleModel.find({ _id: capsuleId });
};

export const ToggleSubscribedUser = async (capsuleId: string, userId: string, toggle: boolean) => {
	if (toggle) {
		await TimeCapsuleModel.findByIdAndUpdate(capsuleId, {
			$push: { subscribedUsers: userId }
		});
	} else {
		await TimeCapsuleModel.findByIdAndUpdate(capsuleId, {
			$pull: { subscribedUsers: userId }
		});
	}
};

export const ToggleReaction = async (capsuleId: string, userId: string, reaction: string) => {
	if (reaction == 'remove') {
		await TimeCapsuleModel.findByIdAndUpdate(capsuleId, { $pull: { reactions: { userId: userId } } }, { multi: true });
	} else {
		// remove other reactions if they are present
		await TimeCapsuleModel.findByIdAndUpdate(capsuleId, { $pull: { reactions: { userId: userId } } }, { multi: true });
		await TimeCapsuleModel.findByIdAndUpdate(capsuleId, {
			$push: { reactions: { reaction: reaction, userId: userId } }
		});
	}
};

export enum Reaction {
	LIKE = 'like',
	LOVE = 'love',
	HAHA = 'haha',
	WOW = 'wow',
	SAD = 'sad',
	ANGRY = 'angry'
}

/**
 * Does some parsing on the time capsule:
 * 1. Detect if the user is subscribed
 * 2. Parse how many reactions does the time capsule have
 * 3. Detect my reaction to this time capsule
 * 4. Detect if the time capsule is opened
 * @param removePrivateData if we need to remove allowed users,
 * allowed groups and other private data to which only the owner has access
 */
const parseTimeCapsule = (timeCapsule: TimeCapsule, requestingUserId: string, removePrivateData: boolean) => {
	// 1. check if the user is subscribed
	if (timeCapsule.subscribedUsers) timeCapsule.isSubscribed = timeCapsule.subscribedUsers.includes(requestingUserId);
	else timeCapsule.isSubscribed = false;

	// 2. fill the reactionsLean with values
	timeCapsule.reactionsLean = Object.keys(Reaction)
		.map((k) => Reaction[k])
		.map((reaction) => ({
			reaction: reaction,
			count: timeCapsule.reactions ? timeCapsule.reactions.filter((r) => r.reaction === reaction).length : 0
		}));

	// 3. detect my reaction to this time capsule
	if (timeCapsule.reactions) {
		let filtered = timeCapsule.reactions.filter((r) => r.userId === requestingUserId);
		timeCapsule.myReaction = filtered[0] ? filtered[0].reaction : '';
	} else {
		timeCapsule.myReaction = '';
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
};
