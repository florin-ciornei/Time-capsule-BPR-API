import * as request from 'supertest';
import app from '../app';
import * as mongoose from 'mongoose';
import UserModel, { User } from '../schemas/userSchema';
import TimeCapsuleModel, { TimeCapsule } from '../schemas/timeCapsuleSchema';
import NotificationModel, { Notification } from '../schemas/notificationSchema';
import GroupSchema, { Group } from '../schemas/groupSchema';

// before running the tests in this file, connect to mongodb, use bprTest database, and clear the existing collections that may remain filled from previous tests
beforeAll(async (done) => {
	await mongoose.connect('mongodb+srv://sepMongo:mongo@cluster0.besa8.mongodb.net/bprTest?retryWrites=true&w=majority', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	});
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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

		const myTimeCapsules = await request(app).get('/timeCapsule/my').set('Authorization', 'Bearer user1').send();
		expect(myTimeCapsules.status).toBe(200);
		let timeCapsuleId = myTimeCapsules.body.timeCapsules[0]._id;

		const result = await request(app)
			.put('/timeCapsule/' + timeCapsuleId)
			.set('Authorization', 'Bearer user1')
			.send({
				name: 'My time capsule name',
				allowedUsers: ['userId3', 'userId4'],
				allowedGroups: ['groupId3', 'groupId4']
			});
		expect(result.status).toBe(200);
		expect(result.body.status).toBe('success');
	});

	it('Deletes a time capsule', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			Authorization: 'Bearer user1'
		});
		expect(resultDelete.status).toBe(200);
		let isDeleted = (await TimeCapsuleModel.find({ _id: createdCapsuleId })).length == 0;
		expect(isDeleted).toBe(true);
	});

	it('Leaves allowed users', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			Authorization: 'Bearer userId2'
		});
		expect(resultLeaveAllowedUsers.status).toBe(200);
		let isRemovedFromAllowedUsers = (await TimeCapsuleModel.find({ _id: createdCapsuleId, allowedUsers: 'userId2' })).length == 0;
		expect(isRemovedFromAllowedUsers).toBe(true);
	});

	it('Fetches my time capsules', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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

		const myTimeCapsules = await request(app).get('/timeCapsule/my').set('Authorization', 'Bearer user1').send();
		expect(myTimeCapsules.body.timeCapsules.length).toBe(1);
	});

	it('Fetches time capsules of another user', async () => {
		// only this capsule will be visible
		await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
		expect(otherUserTimeCapsules.body.timeCapsules[0].name).toBe('capsule name visible');
	});

	it('Fetches public feed', async () => {
		// only this capsule will be visible
		await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
		expect(otherUserTimeCapsules.body.timeCapsules[0].name).toBe('capsule name visible');
	});

	it('Subscribes to a time capsule', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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
		expect(timeCapsule.tags.includes('tag1')).toBe(true);
		expect(timeCapsule.allowedUsers.includes('userId1')).toBe(true);
		expect(timeCapsule.allowedGroups.includes('groupId1')).toBe(true);
		expect(timeCapsule.location.lat).toBe(47.123);
		expect(timeCapsule.location.lon).toBe(20.123);
		expect(timeCapsule.backgroundType).toBe(0);
	});

	it('React to time capsule', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
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

		const reactResponse1 = await request(app)
			.get(`/timeCapsule/${createdCapsuleId}/react/like`)
			.set({
				Authorization: 'Bearer user1'
			})
			.send();
		expect(reactResponse1.status).toBe(200);

		const getCapsuleResponse = await request(app).get(`/timeCapsule/${createdCapsuleId}`).set('Authorization', 'Bearer user1').send();
		expect(getCapsuleResponse.status).toBe(200);
		const timeCapsule = getCapsuleResponse.body.timeCapsule;
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'like')[0].count).toBe(1);
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'love')[0].count).toBe(0);
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'haha')[0].count).toBe(0);
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'wow')[0].count).toBe(0);
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'sad')[0].count).toBe(0);
		expect(timeCapsule.reactionsLean.filter((r) => r.reaction == 'angry')[0].count).toBe(0);

		const reactResponse2 = await request(app)
			.get(`/timeCapsule/${createdCapsuleId}/react/remove`)
			.set({
				Authorization: 'Bearer user1'
			})
			.send();
		expect(reactResponse1.status).toBe(200);

		const getCapsuleResponse1 = await request(app).get(`/timeCapsule/${createdCapsuleId}`).set('Authorization', 'Bearer user1').send();
		expect(getCapsuleResponse1.status).toBe(200);
		const timeCapsule1 = getCapsuleResponse1.body.timeCapsule;
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'like')[0].count).toBe(0);
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'love')[0].count).toBe(0);
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'haha')[0].count).toBe(0);
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'wow')[0].count).toBe(0);
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'sad')[0].count).toBe(0);
		expect(timeCapsule1.reactionsLean.filter((r) => r.reaction == 'angry')[0].count).toBe(0);
	});

	it('Get private feed', async () => {
		const createUser1Result = await request(app).post('/user/register').set('Authorization', 'Bearer user1').send({ name: 'name1', email: 'email1' });
		const createUser2Result = await request(app).post('/user/register').set('Authorization', 'Bearer user2').send({ name: 'name2', email: 'email2' });
		const user1Id = createUser1Result.body.user._id;
		const user2Id = createUser2Result.body.user._id;

		await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: `Bearer ${user2Id}`
			})
			.field('name', 'capsule name visible')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		// is private
		await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: `Bearer ${user2Id}`
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
			.post('/timeCapsule')
			.set({
				Authorization: `Bearer ${user2Id}`
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

		const followResponse = await request(app).put(`/user/followUnfollow/${user2Id}`).set('Authorization', `Bearer ${user1Id}`).send();
		expect(followResponse.status).toBe(200);

		const feedResponse = await request(app).get(`/timeCapsule/feed`).set('Authorization', `Bearer ${user1Id}`).send();
		expect(feedResponse.status).toBe(200);
		expect(feedResponse.body.timeCapsules.length).toBe(1); // only one should be visible
		expect(feedResponse.body.timeCapsules[0].name).toBe('capsule name visible');
	});

	it('Search time capsules', async () => {
		const resultCreate = await request(app)
			.post('/timeCapsule')
			.set({
				Authorization: 'Bearer user1'
			})
			.field('name', 'capsule name')
			.field('description', 'capsule description')
			.field('openDate', '2022-03-20T12:55:26.075Z')
			.field('isPrivate', 'false')
			.field('lat', '47.123')
			.field('lon', '20.123')
			.field('backgroundType', '0');

		expect(resultCreate.status).toBe(200);

		const feedResponse = await request(app).post(`/timeCapsule/search`).set('Authorization', `Bearer user1`).send({
			keyword: 'capsule name',
			search_in_name: true
		});

		expect(feedResponse.status).toBe(200);
		expect(feedResponse.body.timeCapsules.length).toBe(1);
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
});
