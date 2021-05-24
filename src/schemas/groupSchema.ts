import * as mongoose from 'mongoose';

export interface Group extends mongoose.Document {
	name: string;
	users: string[];
	owner: string;
	usersCount: number;
}

const GroupSchema: mongoose.Schema = new mongoose.Schema({
	name: String,
	users: [{ type: String, ref: 'User' }],
	owner: { type: String, ref: 'User' },
	usersCount: Number
});

export default mongoose.model<Group>('Group', GroupSchema);
