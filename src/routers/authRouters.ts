import * as express from 'express';
import firebase from '../services/firebaseService';

//this route is for development purposes so we don't have to request a firebase token each time.
//it expects that the user id is located in the Authorization header.
export const authRouter = async (req: express.Request, res: express.Response, next) => {
	if (!req.headers.authorization) {
		// if the token is missing, continue. This is the case for guest user.
		return next();
	} else if (process.env.NODE_ENV == 'test' || process.env.NODE_ENV == 'dev') {
		// while testing consider the token to be the user id
		req.userId = req.headers.authorization.replace('Bearer ', '');
	} else {
		try {
			let decodedToken = await firebase.admin.auth().verifyIdToken(req.headers.authorization.replace('Bearer ', ''));
			req.userId = decodedToken.uid;
		} catch (e) {
			console.log(e.code, e.message);
			return res.status(400).send('Failed to decode firebase token');
		}
	}
	next();
};

export const requireAuth = (req: express.Request, res: express.Response, next) => {
	if (!req.userId) return res.status(403).send({ code: 'authentication_required', message: 'To call this route you must be authenticated' });
	next();
};
