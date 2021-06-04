import * as mongoose from 'mongoose';
import app from './app';
import * as credentials from './credentials.json';
const port = process.env.PORT || 8080;

//connect to MongoDB and start the server
(async () => {
	console.log('Starting server...');
	try {
		await mongoose.connect(credentials.mongoDbConnectionString, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		});
	} catch (e) {
		console.log('Failed to connect to MongoDB: ' + e);
		return;
	}
	console.log('Connected to MongoDB');
	app.listen(port, () => {
		console.log(`REST API listening at http://localhost:${port}`);
	});
})();

module.exports = app;
