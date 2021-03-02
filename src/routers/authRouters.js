var admin = require('firebase-admin');

//this routes is for development purposes so we don't have to request a firebase token each time.
//it expects that the user id is located in the Authorization header.
module.exports.devAuthRouter = (req, res, next) => {
    req.userId = req.headers.authorization.replace('Bearer ', '');
    next();
};
