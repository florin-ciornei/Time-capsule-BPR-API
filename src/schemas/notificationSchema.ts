import * as mongoose from "mongoose";

export interface Notification extends mongoose.Document {
    timeCapsule: string,
    byUser: string,
    toUser: string,
    time: Date,
    group: string
}

const NotificationSchema: mongoose.Schema = new mongoose.Schema(
    {
        timeCapsule: { type: String, ref: 'TimeCapsule'},
        byUser: { type: String, ref: 'User'},
        toUser: { type: String, ref: 'User'},
        time: Date,
        group: { type: String, ref: 'Group'}
    },
);

export default mongoose.model<Notification>('Notification', NotificationSchema);