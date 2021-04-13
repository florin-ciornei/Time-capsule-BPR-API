import * as request from 'supertest';
import app from '../app';
import * as mongoose from 'mongoose';
import UserModel, { User } from "../schemas/userSchema";


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

describe('Test UserController', () => {
	it('Registers an user', async () => {
		const result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		expect(result.status).toBe(200);
		expect(result.body.status).toBe("success");
	});
	it('Fails to register user with same ID', async () => {
		const result = await request(app).post("/user/register").set('Authorization', 'Bearer user1').send({ name: "name", email: "email" });
		expect(result.status).toBe(400);
		expect(result.body.code).toBe("existing_id");
		expect(result.body.status).toBe("error");
	});
});

afterAll(async (done) => {
	await mongoose.disconnect();
	done();
})