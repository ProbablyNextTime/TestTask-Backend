import mongoose, { Schema, Document } from "mongoose";

export interface SurveyInterface extends Document{
  questions: string[],
  title: string,
  users: mongoose.Types.ObjectId[]
}

const SurveySchema: Schema = new Schema({
  questions: { type: Array(String), required: true },
  title: { type: String, required: true, unique: true },
  users: { type: Array(mongoose.Types.ObjectId), required: true},
});

const Survey = mongoose.model<SurveyInterface>("Survey", SurveySchema);
export default Survey;