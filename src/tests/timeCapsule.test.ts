import * as request from 'supertest';
import app from '../app';
import * as mongoose from 'mongoose';
import UserModel, { User } from "../schemas/userSchema";
import TimeCapsuleModel, { TimeCapsule } from "../schemas/timeCapsuleSchema";

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
	await UserModel.deleteMany({});
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
		const myTimeCapsules = await request(app).get("/timeCapsule/my").set('Authorization', 'Bearer user1').send();
		expect(myTimeCapsules.status).toBe(200);
		let timeCapsuleId = myTimeCapsules.body.timeCapsules[0]._id;

		const result = await request(app).put("/timeCapsule/" + timeCapsuleId).set('Authorization', 'Bearer user1').send({
			"name": "My time capsule name",
			"allowedUsers": [
				"324",
				"123test123"
			],
			"allowedGroups": [
				"ce e asta? :))",
				"un grup"
			]
		});
		expect(result.status).toBe(200);
		expect(result.body.status).toBe("success");
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})