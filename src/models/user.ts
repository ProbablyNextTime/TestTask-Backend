import mongoose, {Schema, Document, Types} from "mongoose";

interface ISurveyAnswers  {
  surveyId: mongoose.Types.ObjectId;
  answers: string[]
}

export interface UserInterface extends Document{
  _id: string;
  username: string;
  password: string;
  role: string;
  completedSurveys: ISurveyAnswers[]
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  completedSurveys: [{ surveyId: mongoose.Types.ObjectId, answers: Array(String)}],
});

const User = mongoose.model<UserInterface>("User", UserSchema);
export default User;