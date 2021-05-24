import * as request from 'supertest';
import app from '../app';
import * as mongoose from 'mongoose';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from "../schemas/timeCapsuleSchema";
import NotificationModel, { Notification } from "../schemas/notificationSchema";
import GroupSchema, { Group } from "../schemas/groupSchema";
import { SendAddedToAllowedUsersNotifications, SendAddedToGroupNotifications, SendFollowNotification, SendSubScribeToTimeCapsuleNotification } from '../services/notificationService';

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

describe('Test NotificationController', () => {
	it("Creates and retrieves notifications", async () => {
		const resultCreate = await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
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
		const createdCapsuleId = resultCreate.body.timeCapsule._id;

		// ids don't quite matter here, they should only be valid
		await SendAddedToGroupNotifications("60ab481bb4e9694f9d868862", ["user1", "user2"], "triggerUserId");
		await SendAddedToAllowedUsersNotifications(createdCapsuleId, ["user1", "user2"], "triggerUserId");
		await SendSubScribeToTimeCapsuleNotification(createdCapsuleId, "triggerUserId");
		await SendFollowNotification("triggerUserId", "user1");

		const response = await request(app).get("/notification")
			.set({
				'Authorization': 'Bearer user1'
			});
		expect(response.status).toBe(200);
		expect(response.body.notifications.length).toBe(4);
		expect(response.body.notifications.filter(n => n.type == "follow").length).toBe(1);
		expect(response.body.notifications.filter(n => n.type == "addedToAllowedUsers").length).toBe(1);
		expect(response.body.notifications.filter(n => n.type == "subscribedToTimeCapsule").length).toBe(1);
		expect(response.body.notifications.filter(n => n.type == "addedToGroup").length).toBe(1);
	})
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})

