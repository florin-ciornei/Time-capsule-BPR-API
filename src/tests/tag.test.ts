import * as request from 'supertest';
import app from '../app';
import * as mongoose from 'mongoose';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from "../schemas/timeCapsuleSchema";
import NotificationModel, { Notification } from "../schemas/notificationSchema";
import GroupSchema, { Group } from "../schemas/groupSchema";

// before running the tests in this file, connect to mongodb, use bprTest database, and clear the existing collections that may remain filled from previous tests
beforeAll(async (done) => {
	await mongoose.connect(
		'mongodb+srv://sepMongo:mongo@cluster0.besa8.mongodb.net/bprTest?retryWrites=true&w=majority',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		}
	);
	done();
});

beforeEach(async (done) => {
	await UserModel.deleteMany({});
	await TimeCapsuleModel.deleteMany({});
	await NotificationModel.deleteMany({});
	await GroupSchema.deleteMany({});
	done();
});

describe('Test TagsController', () => {
	it("Gets all tags", async () => {
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name visible')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'true')
			.field('tags[]', 'tag4')
			.field('tags[]', 'tag5')
			.field('tags[]', 'tag6')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('allowedUsers[]', 'userId1')
			.field('allowedUsers[]', 'userId2')
			.field('allowedGroups[]', 'groupId1')
			.field('allowedGroups[]', 'groupId2')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		const response = await request(app).get("/tag/all").send();
		expect(response.status).toBe(200);
		// only 6 because some of them repeat (tag1, tag2, tag3) and shouldn't be returned
		expect(response.body.tags.length).toBe(6);
		expect(response.body.tags.includes("tag1")).toBe(true);
		expect(response.body.tags.includes("tag2")).toBe(true);
		expect(response.body.tags.includes("tag3")).toBe(true);
		expect(response.body.tags.includes("tag4")).toBe(true);
		expect(response.body.tags.includes("tag5")).toBe(true);
		expect(response.body.tags.includes("tag6")).toBe(true);
	})

	it("Gets register suggestions ordered desc by nr of uses", async () => {
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name visible')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'true')
			.field('tags[]', 'tag4')
			.field('tags[]', 'tag5')
			.field('tags[]', 'tag6')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('tags[]', 'tag1')
			.field('allowedUsers[]', 'userId1')
			.field('allowedUsers[]', 'userId2')
			.field('allowedGroups[]', 'groupId1')
			.field('allowedGroups[]', 'groupId2')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		const response = await request(app).get("/tag/registerSuggestions").send();
		expect(response.status).toBe(200);
		// again, some tags may repeat and should be excluded by API
		expect(response.body.tags.length).toBe(6);
		expect(response.body.tags.includes("tag1")).toBe(true);
		expect(response.body.tags.includes("tag2")).toBe(true);
		expect(response.body.tags.includes("tag3")).toBe(true);
		expect(response.body.tags.includes("tag4")).toBe(true);
		expect(response.body.tags.includes("tag5")).toBe(true);
		expect(response.body.tags.includes("tag6")).toBe(true);
		expect(response.body.tags[0]).toBe("tag1");
	})

	it("Gets tag suggestions", async () => {
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name visible')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': `Bearer asd`
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'true')
			.field('tags[]', 'some tag')
			.field('tags[]', 'other tag')
			.field('tags[]', 'another tag')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		const response = await request(app).get(`/tag/suggestions/tag`).send();
		expect(response.status).toBe(200);
		expect(response.body.tags.length).toBe(6);
		expect(response.body.tags.includes("tag1")).toBe(true);
		expect(response.body.tags.includes("tag2")).toBe(true);
		expect(response.body.tags.includes("some tag")).toBe(true);
		expect(response.body.tags.includes("other tag")).toBe(true);
		expect(response.body.tags.includes("another tag")).toBe(true);

		const response1 = await request(app).get(`/tag/suggestions/another`).send();
		expect(response1.status).toBe(200);
		expect(response.body.tags.includes("another tag")).toBe(true);
	});

	it("Saves tag preferences", async () => {
		const createUser1Result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		const user1Id = createUser1Result.body.user._id;
		const response = await request(app).put("/tag/saveTags").set('Authorization', 'Bearer user1').send({
			"tags": [
				"tag1",
				"tag2",
				"tag3"
			]
		});
		expect(response.status).toBe(200);
		const user = await UserModel.findById(user1Id);
		expect(user.prefferedTags.includes("tag1")).toBe(true);
		expect(user.prefferedTags.includes("tag2")).toBe(true);
		expect(user.prefferedTags.includes("tag3")).toBe(true);
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})