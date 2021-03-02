var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema(
    {
        _id: String, //this id is the same id as in firebase
        name: String,
        email: String,
    },
    { _id: false }
);

var User = mongoose.model('User', UserSchema);
module.exports = User;
