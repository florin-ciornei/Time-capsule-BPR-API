//main imports
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

//controller imports
import UserController from './controllers/userController';
import GroupController from './controllers/groupController';
import TimeCapsuleController from './controllers/timeCapsuleController';
import TagController from './controllers/tagController';
import NotificationController from './controllers/notificationController';

//router imports
import { devAuthRouter } from './routers/authRouters';

const app = express();

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
app.use('/notification', NotificationController);

export default app;