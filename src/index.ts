//main imports
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as mongoose from 'mongoose';

//controller imports
import UserController from './controllers/userController';
import GroupController from './controllers/groupController';
import TimeCapsuleController from './controllers/timeCapsuleController';
import TagController from './controllers/tagController';

//router imports
import { devAuthRouter } from './routers/authRouters';

const app = express();
const port = 8080;

//some usefull express additions
app.use(cors()); //allow all origins to make requests to the API
app.use('/doc', express.static('doc')); //API documentation
app.use(bodyParser.json()); //parse for the JSON body
app.use(devAuthRouter); //authorization header

//add controllers to express app
app.use('/user', UserController);
app.use('/group', GroupController);
app.use('/tag', TagController);
app.use('/timeCapsule', TimeCapsuleController);

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
