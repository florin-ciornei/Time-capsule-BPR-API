import GroupModel, { Group } from '../schemas/groupSchema';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';


export const GetAllTags = async (): Promise<string[]> => {
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags" } }
	]);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
	return tags;
}

export const GetRegisterTagSuggestions = async (): Promise<string[]> => {
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags", usages: { $sum: 1 } } },
		{ $sort: { usages: -1 } }
	]).limit(20);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
	return tags;
}

export const GetTagSuggestions = async (query: string): Promise<string[]> => {
	let tags = await TimeCapsuleModel.aggregate([
		{ $unwind: "$tags" },
		{ $project: { tags: 1 } },
		{ $group: { _id: "$tags" } },
		{ $match: { _id: { '$regex': query, '$options': 'i' } } }
	]).limit(20);
	//after the above aggregate we get an array of json objects [{_id:'tag name'}]. The following line transforms it into an array of strings (tags).
	tags = tags.map(t => t._id);
	return tags;
}

export const SavePrefferedTags = async (tags: string[], userId: string) => {
	await UserModel.updateOne(
		{ _id: userId },
		{ $set: { prefferedTags: tags } });
}