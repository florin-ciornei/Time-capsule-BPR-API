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

describe('Test UseController', () => {
	it('Registers an user', async () => {
		const result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		expect(result.status).toBe(200);
		expect(result.body.status).toBe("success");
	});

	it('Fails to register user with same ID', async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		const result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		expect(result.status).toBe(400);
		expect(result.body.code).toBe("existing_id");
		expect(result.body.status).toBe("error");
	});

	it("Searches users", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		await request(app).post("/user/register").set('Authorization', 'Bearer user2').send({ name: "name2", email: "email2" });
		await request(app).post("/user/register").set('Authorization', 'Bearer user3').send({ name: "name3", email: "email3" });

		const response = await request(app).get("/user/search/name").send();
		expect(response.status).toBe(200);
		expect(response.body.users.length).toBe(3);

		const response2 = await request(app).get("/user/search/name2").send();
		expect(response2.status).toBe(200);
		expect(response2.body.users.length).toBe(1);
	})

	it("Gets my profile", async () => {
		const createUser1Result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		const user1Id = createUser1Result.body.user._id;
		const response = await request(app).get("/user/me").set('Authorization', 'Bearer user1').send();
		expect(response.status).toBe(200);
		expect(response.body.user._id).toBe("user1");
		expect(response.body.user.name).toBe("name");
		expect(response.body.user.followersCount).toBe(0);
		expect(response.body.user.followingCount).toBe(0);
		expect(response.body.user.timeCapsulesCount).toBe(0);
		expect(response.body.user.profileImageUrl).toBe("");
	})

	it("Gets profile of another user", async () => {
		const createUser1Result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		const user1Id = createUser1Result.body.user._id;
		const response = await request(app).get("/user/user1").set('Authorization', 'Bearer user2').send();
		expect(response.status).toBe(200);
		expect(response.body.user._id).toBe("user1");
		expect(response.body.user.name).toBe("name");
		expect(response.body.user.followersCount).toBe(0);
		expect(response.body.user.followingCount).toBe(0);
		expect(response.body.user.profileImageUrl).toBe("");
	})

	it("Follows user", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		await request(app).post("/user/register").set('Authorization', 'Bearer user2').send({ name: "name2", email: "email2" });
		const response = await request(app).put(`/user/followUnfollow/user2`).set('Authorization', 'Bearer user1').send();
		expect(response.status).toBe(200);

		const responseGetUser1 = await request(app).get("/user/user1").send();
		const responseGetUser2 = await request(app).get("/user/user2").send();
		expect(responseGetUser1.body.user.followingCount).toBe(1);
		expect(responseGetUser2.body.user.followersCount).toBe(1);
	})

	it("Updates user data", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		const response = await request(app).put("/user").set('Authorization', 'Bearer user1').send({ name: "new name" });
		expect(response.status).toBe(200);
		const responseGetUser1 = await request(app).get("/user/user1").send();
		expect(responseGetUser1.body.user.name).toBe("new name");
	})

	it("Deletes user profile", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		const response = await request(app).delete("/user").set('Authorization', 'Bearer user1').send();
		expect(response.status).toBe(200);
		const responseGetUser = await request(app).get("/user/user1").send();
		expect(responseGetUser.status).toBe(404);
		expect(responseGetUser.body.status).toBe("error");
		expect(responseGetUser.body.code).toBe("user_not_found");
	})

	it("Updates profile image", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		const response = await request(app).put("/user/profileImage").set('Authorization', 'Bearer user1').attach("image", `${__dirname}\\bork.png`);
		expect(response.status).toBe(200);
		const responseGetUser1 = await request(app).get("/user/user1").send();
		expect(responseGetUser1.body.user.profileImageUrl.includes("https://storage.googleapis.com/auth-development-25425.appspot.com/capsuleContents/profilePicture/user1")).toBe(true);
	})

	it("Deletes profile image", async () => {
		await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name1", email: "email1" });
		const response = await request(app).put("/user/profileImage").set('Authorization', 'Bearer user1').attach("image", `${__dirname}\\bork.png`);
		expect(response.status).toBe(200);
		const responseGetUser1 = await request(app).get("/user/user1").send();
		expect(responseGetUser1.body.user.profileImageUrl.includes("https://storage.googleapis.com/auth-development-25425.appspot.com/capsuleContents/profilePicture/user1")).toBe(true);
		const responseDeletePicturei = await request(app).delete("/user/profileImage").set('Authorization', 'Bearer user1').send();
		expect(responseDeletePicturei.status).toBe(200);
		const responseGetUser2 = await request(app).get("/user/user1").send();
		expect(responseGetUser2.body.user.profileImageUrl).toBe("");
	})
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})