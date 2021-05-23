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


describe('Test TimeCapsuleController', () => {
	it('Creates a time capsule', async () => {
		// this request is sent a little bit differently (with a bunch of .field(...) calls) because it should be sent as a form data in order to be able to send files also
		const result = await request(app)
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
		expect(result.status).toBe(200);
	});

	it('Updates time capsule', async () => {
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
		expect(resultCreate.status).toBe(200);

		const myTimeCapsules = await request(app).get("/timeCapsule/my").set('Authorization', 'Bearer user1').send();
		expect(myTimeCapsules.status).toBe(200);
		let timeCapsuleId = myTimeCapsules.body.timeCapsules[0]._id;

		const result = await request(app).put("/timeCapsule/" + timeCapsuleId).set('Authorization', 'Bearer user1').send({
			"name": "My time capsule name",
			"allowedUsers": [
				"userId3",
				"userId4"
			],
			"allowedGroups": [
				"groupId3",
				"groupId4"
			]
		});
		expect(result.status).toBe(200);
		expect(result.body.status).toBe("success");
	});

	it('Deletes a time capsule', async () => {
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

		expect(resultCreate.status).toBe(200);
		const createdCapsuleId = resultCreate.body.timeCapsule._id;
		const resultDelete = await request(app).delete(`/timeCapsule/delete/${createdCapsuleId}`).set({
			'Authorization': 'Bearer user1'
		});
		expect(resultDelete.status).toBe(200);
		let isDeleted = (await TimeCapsuleModel.find({ _id: createdCapsuleId })).length == 0;
		expect(isDeleted).toBe(true);
	});

	it('Leaves allowed users', async () => {
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

		expect(resultCreate.status).toBe(200);
		const createdCapsuleId = resultCreate.body.timeCapsule._id;

		const resultLeaveAllowedUsers = await request(app).put(`/timeCapsule/leaveAllowedUsers/${createdCapsuleId}`).set({
			'Authorization': 'Bearer userId2'
		});
		expect(resultLeaveAllowedUsers.status).toBe(200);
		let isRemovedFromAllowedUsers = (await TimeCapsuleModel.find({ _id: createdCapsuleId, allowedUsers: "userId2" })).length == 0;
		expect(isRemovedFromAllowedUsers).toBe(true);
	});

	it('Fetches my time capsules', async () => {
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

		expect(resultCreate.status).toBe(200);

		const myTimeCapsules = await request(app).get("/timeCapsule/my").set('Authorization', 'Bearer user1').send();
		expect(myTimeCapsules.body.timeCapsules.length).toBe(1);
	});

	it('Fetches time capsules of another user', async () => {
		// only this capsule will be visible
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
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

		// is private
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'true')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		// has allowed users/allowed groups, so it is not private
		await request(app)
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


		const otherUserTimeCapsules = await request(app).get(`/timeCapsule/user/user1`).set('Authorization', 'Bearer user2').send();
		expect(otherUserTimeCapsules.body.timeCapsules.length).toBe(1); // only one should be visible
		expect(otherUserTimeCapsules.body.timeCapsules[0].name).toBe("capsule name visible");
	});

	it('Fetches time capsules of another user', async () => {
		// only this capsule will be visible
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
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

		// is private
		await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'true')
			.field('tags[]', 'tag1')
			.field('tags[]', 'tag2')
			.field('tags[]', 'tag3')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		// has allowed users/allowed groups, so it is not private
		await request(app)
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


		const otherUserTimeCapsules = await request(app).get(`/timeCapsule/publicFeed`).send();
		expect(otherUserTimeCapsules.body.timeCapsules.length).toBe(1); // only one should be visible
		expect(otherUserTimeCapsules.body.timeCapsules[0].name).toBe("capsule name visible");
	});

	it('Subscribes to a time capsule', async () => {
		const resultCreate = await request(app)
			.post("/timeCapsule")
			.set({
				'Authorization': 'Bearer user1'
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		expect(resultCreate.status).toBe(200);
		const createdCapsuleId = resultCreate.body.timeCapsule._id;
		const toggleSubscription = await request(app).get(`/timeCapsule/${createdCapsuleId}/toggleSubscription`).set('Authorization', 'Bearer user1').send();
		expect(toggleSubscription.status).toBe(200);

		const getTimecapsulesToWhichISubcribed = await request(app).get(`/timeCapsule/subscribed`).set('Authorization', 'Bearer user1').send();
		expect(getTimecapsulesToWhichISubcribed.status).toBe(200);
		expect(getTimecapsulesToWhichISubcribed.body.subscribedCapsules.length).toBe(1);
	});

	it('Gets capsule by ID', async () => {
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

		expect(resultCreate.status).toBe(200);
		const createdCapsuleId = resultCreate.body.timeCapsule._id;
		const getCapsuleResponse = await request(app).get(`/timeCapsule/${createdCapsuleId}`).set('Authorization', 'Bearer user1').send();
		expect(getCapsuleResponse.status).toBe(200);
		const timeCapsule = getCapsuleResponse.body.timeCapsule;
		expect(timeCapsule.tags.includes("tag1")).toBe(true);
		expect(timeCapsule.allowedUsers.includes("userId1")).toBe(true);
		expect(timeCapsule.allowedGroups.includes("groupId1")).toBe(true);
		expect(timeCapsule.location.lat).toBe(47.123);
		expect(timeCapsule.location.lon).toBe(20.123);
		expect(timeCapsule.backgroundType).toBe(0);
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})