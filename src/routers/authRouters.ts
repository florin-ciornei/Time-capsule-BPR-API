import * as express from 'express';

//this route is for development purposes so we don't have to request a firebase token each time.
//it expects that the user id is located in the Authorization header.
export const devAuthRouter = (req: express.Request, res: express.Response, next) => {
    if (process.env.NODE_ENV == "test") {
        req.userId = req.headers.authorization.replace('Bearer ', '');
    } else {
        // this shold parse firebase token
        req.userId = req.headers.authorization.replace('Bearer ', '');
    }
    next();
};
