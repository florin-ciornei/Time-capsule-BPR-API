import * as mongoose from 'mongoose';
import app from './app';
const port = process.env.PORT || 8080;

//connect to MongoDB and start the server
(async () => {
	console.log('Starting server...');
	try {
		await mongoose.connect('mongodb+srv://sepMongo:mongo@cluster0.besa8.mongodb.net/bpr?retryWrites=true&w=majority', {
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
		console.log(`For API documentation visit http://localhost:${port}/doc`);
	});
})();

module.exports = app;
