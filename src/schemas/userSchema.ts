import * as mongoose from "mongoose";

export interface User extends mongoose.Document {
    _id: string,
    name: string,
    email: string,
}

const UserSchema: mongoose.Schema = new mongoose.Schema(
    {
        _id: String, //this id is the same id as in firebase
        name: String,
        email: String,
    },
    { _id: false },
);

export default mongoose.model<User>('User', UserSchema);