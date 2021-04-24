import * as mongoose from "mongoose";

export interface User extends mongoose.Document {
    _id: string,
    name: string,
    email: string,
    followedByUsers: string[],
    prefferedTags: string[],

    // calculated at runtime, not stored in MongoDB
    isFollowedByMe:boolean
}

const UserSchema: mongoose.Schema = new mongoose.Schema(
    {
        _id: String, //this id is the same id as in firebase
        name: String,
        email: String,
        followedByUsers: [{ type: String, ref: 'User' }],
        prefferedTags: [{ type: String }],
    },
    { _id: false },
);

export default mongoose.model<User>('User', UserSchema);