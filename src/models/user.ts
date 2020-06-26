import mongoose, { Schema, Document } from "mongoose";
import express, {Response} from "express"

export interface UserInterface extends Document{
  _id: string;
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