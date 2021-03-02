const express = require('express');
const app = express();
const port = 8080;
const userController = require('./controllers/userController');
const timeCapsuleController = require('./controllers/userController');
const mongoose = require('mongoose');
const cors = require('cors');

app.use('/doc', express.static('doc')); //API documentation
app.use(cors()); //allow all origins to make requests to the API

//controllers
app.use('/user', userController);
app.use('/timeCapsule', timeCapsuleController);

//connect to MongoDB and start the server
(async () => {
    console.log('Starting server...');
    try {
        await mongoose.connect(
            'mongodb+srv://sepMongo:mongo@cluster0.besa8.mongodb.net/bpr?retryWrites=true&w=majority',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
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
