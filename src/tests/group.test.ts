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

describe('Test GroupController', () => {
	it('Creates a group', async () => {
		const response = await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});

		expect(response.status).toBe(200);
		expect(response.body.group.name).toBe('group name');
		expect(response.body.group.owner).toBe('creatorId');
		expect(response.body.group.users.includes('user1')).toBe(true);
		expect(response.body.group.users.includes('user2')).toBe(true);
	});

	it('Fails to create group with existing name', async () => {
		await request(app).post('/group').set('Authorization', 'Bearer creatorId').send({
			name: 'group name',
			users: []
		});
		const response = await request(app).post('/group').set('Authorization', 'Bearer creatorId').send({
			name: 'group name',
			users: []
		});
		expect(response.status).toBe(400);
		expect(response.body.status).toBe('error');
		expect(response.body.code).toBe('name_not_unique');
	});

	it('Updates a group', async () => {
		const responseCreate = await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});
		const groupId = responseCreate.body.group._id;

		const responseUpdate = await request(app)
			.put(`/group/${groupId}`)
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'new name',
				users: ['user1', 'user2', 'user3']
			});
		const group: Group = responseUpdate.body.group;
		expect(responseUpdate.status).toBe(200);
		expect(group.name).toBe('new name');
		expect(group.users.length).toBe(3);
		expect(group.users.includes('user1')).toBe(true);
		expect(group.users.includes('user2')).toBe(true);
		expect(group.users.includes('user3')).toBe(true);
	});

	it('Deletes a group', async () => {
		const responseCreate = await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});
		const groupId = responseCreate.body.group._id;
		const responseDelete = await request(app).delete(`/group/delete/${groupId}`).set('Authorization', 'Bearer creatorId').send();
		expect(responseDelete.status).toBe(200);
		expect((await GroupSchema.find({ _id: groupId })).length).toBe(0);
	});

	it('Gets all my groups', async () => {
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name1',
				users: ['user1', 'user2']
			});
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name2',
				users: ['user1', 'user2']
			});

		const response = await request(app).get('/group/all').set('Authorization', 'Bearer creatorId').send();
		expect(response.status).toBe(200);
		expect(response.body.groups.length).toBe(3);
	});

	it('Gets all groups containg me', async () => {
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name1',
				users: ['user1', 'user2', 'user3']
			});
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name2',
				users: ['user1', 'user2']
			});

		const response = await request(app).get('/group/containingMe').set('Authorization', 'Bearer user3').send();
		expect(response.status).toBe(200);
		expect(response.body.groups.length).toBe(1);
	});

	it('Gets group by id', async () => {
		const createUser1Result = await request(app).post('/user/register').set('Authorization', 'Bearer user1').send({ name: 'name1', email: 'email1' });
		const createUser2Result = await request(app).post('/user/register').set('Authorization', 'Bearer user2').send({ name: 'name2', email: 'email2' });
		const user1Id = createUser1Result.body.user._id;
		const user2Id = createUser2Result.body.user._id;

		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name',
				users: ['user1', 'user2']
			});
		const responseCreate = await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name1',
				users: [user1Id, user2Id]
			});
		await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name2',
				users: ['user1', 'user2']
			});
		const groupId = responseCreate.body.group._id;
		expect(responseCreate.status).toBe(200);

		const responseGet = await request(app).get(`/group/${groupId}`).set('Authorization', 'Bearer creatorId').send();
		expect(responseGet.status).toBe(200);
		expect(responseGet.body.group._id).toBe(groupId);
		expect(responseGet.body.group.name).toBe('group name1');
		expect(responseGet.body.group.users.length).toBe(2);
	});

	it('Leaves a group', async () => {
		const createUser1Result = await request(app).post('/user/register').set('Authorization', 'Bearer user1').send({ name: 'name1', email: 'email1' });
		const createUser2Result = await request(app).post('/user/register').set('Authorization', 'Bearer user2').send({ name: 'name2', email: 'email2' });
		const user1Id = createUser1Result.body.user._id;
		const user2Id = createUser2Result.body.user._id;

		const responseCreate = await request(app)
			.post('/group')
			.set('Authorization', 'Bearer creatorId')
			.send({
				name: 'group name1',
				users: [user1Id, user2Id]
			});
		const groupId = responseCreate.body.group._id;
		expect(responseCreate.status).toBe(200);

		const responseLeave = await request(app).put(`/group/leaveGroup/${groupId}`).set('Authorization', `Bearer ${user1Id}`).send();
		expect(responseLeave.status).toBe(200);

		const responseGet = await request(app).get(`/group/${groupId}`).set('Authorization', 'Bearer creatorId').send();
		expect(responseGet.status).toBe(200);
		expect(responseGet.body.group.users.length).toBe(1);
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
});
