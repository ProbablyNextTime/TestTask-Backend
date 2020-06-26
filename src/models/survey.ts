import mongoose, { Schema, Document } from "mongoose";

export interface SurveyInterface extends Document{
  questions: string[],
  tittle: string,
}

const SurveySchema: Schema = new Schema({
  questions: { type: Array(String), required: true },
  tittle: { type: String, required: true },
});

const Survey = mongoose.model<SurveyInterface>("Survey", SurveySchema);
export default Survey;