import * as mongoose from "mongoose";

export interface Group extends mongoose.Document {
	_id: mongoose.Types.ObjectId,
	name: string,
	users: mongoose.Types.ObjectId,
	owner: mongoose.Types.ObjectId,
}

const GroupSchema: mongoose.Schema = new mongoose.Schema(
	{
		name: String,
		users: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
		owner: { type: mongoose.Types.ObjectId, ref: 'User' }
	},
);

export default mongoose.model<Group>('Group', GroupSchema);