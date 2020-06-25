import mongoose, { Schema, Document } from "mongoose";

export interface UserInterface extends Document {
  username: string;
  password: string;
  role: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

const User = mongoose.model<UserInterface>("User", UserSchema);
export default User;