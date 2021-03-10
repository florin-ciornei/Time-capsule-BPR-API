import * as express from 'express';

//this route is for development purposes so we don't have to request a firebase token each time.
//it expects that the user id is located in the Authorization header.
export const devAuthRouter = (req: express.Request, res: express.Response, next) => {
    req.userId = req.headers.authorization.replace('Bearer ', '');
    next();
};
