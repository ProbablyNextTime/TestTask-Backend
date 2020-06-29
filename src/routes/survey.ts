import express, {Request, Response} from "express"
import bodyParser from "body-parser";
import {checkAdmin, passportInitialize} from "../passportConfig";
import Survey, {SurveyInterface} from "../models/survey";
import User, {UserInterface} from "../models/user";
import mongoose, {isValidObjectId} from "mongoose";
import passport from "passport";

export const surveysRouter = express.Router();

surveysRouter.use(bodyParser.json());
surveysRouter.use(bodyParser.urlencoded({ extended: true }));

passportInitialize(passport);

surveysRouter.use(passport.authenticate("jwt", {session: false}));

surveysRouter.post("/", checkAdmin, async (req: Request, res: Response) => {
  try {
    // Try to get survey to check if survey with such tittle already exists
    const survey: SurveyInterface | null = await Survey.findOne({title: req.body.title});
    // If survey with such tittle exists send corresponding message
    if(survey) {
      res.status(409).send({message: "such tittle already exists"});
      return;
    }

    // Check if survey questions array is not empty
    if(req.body.questions.length !== 0) {
       const newSurvey = new Survey({
        questions: req.body.questions,
        title: req.body.title,
        users: []
       });

      // Save new survey to DB
       await newSurvey.save();
       res.status(200).send({survey: newSurvey})

    } else {
      res.status(400).send({message: "Mo questions were provided"})
    }

  } catch (error) {
    res.status(500).send({message: "Unknown server error"}) // TODO: Error handling
  }
});


// Get all user`s uncompleted surveys
surveysRouter.get("/", async (req: Request, res: Response) => {
  try {
      // get user from DB
      const user: UserInterface | null = await User.findOne({username: req.user?.username});
      if(user) {
        // If user exists get all surveys that he has already completed
        const completedSurveys: mongoose.Types.ObjectId[] =  user.completedSurveys.map( survey => survey.surveyId );
        // Get all surveys that user hasn't completed yet
        const uncompletedSurveys: SurveyInterface[] | null = await Survey.find({_id : {$exists: true, $nin: completedSurveys}});
        res.status(200).send({surveys: uncompletedSurveys});
      }
    } catch (error) {
    res.status(500).send({message: "Unknown server error"}) // TODO: Error handling
  }
})

// Get survey endpoint
surveysRouter.get("/", async (req: Request, res: Response) => {
  try {
      // Get surveys from DB
      const survey: SurveyInterface | null = await Survey.findOne({_id: req.query.Id})
      if(survey) {
        res.status(200).send({survey: survey})
      } else {
        res.status(404).send({message: "Not Found"})
      }

    } catch (error) {
    res.status(500).send({message: "Unknown server error"}) // TODO: Error handling
  }
});

// Submit survey answer endpoint
surveysRouter.post("/postAnswer", async (req: Request, res: Response) => {
  try {
    // get user from DB
    const user: UserInterface | null = await User.findOne({_id: req.user?._id}).populate("completedSurveys");
    if(user) {
        // Check if survey id is valid Object ID
        if(isValidObjectId(req.body.surveyId)) {
          // Get completed surveys Ids
          const completedSurveys: mongoose.Types.ObjectId[] = user.completedSurveys.map( survey => survey.surveyId );
          const survey : SurveyInterface | null = await Survey.findOne({_id : req.body.surveyId});

          if(!completedSurveys.find((surveyId) => surveyId === req.body.surveyId )) {
            user.completedSurveys.push({surveyId: req.body.surveyId, answers: req.body.answers});
            await User.updateOne({_id: req.user?._id}, user);

            if(survey) {
              survey.users.push(user._id);
              await Survey.updateOne({_id: req.body.surveyId}, survey);
            }

            res.status(200).send({message: "Ok"});
          }
          else {
            res.status(400).send({message: "Survey has already been completed"})
          }
        } else {
          res.status(400).send({message: "Not found"});
        }
    }
  } catch (error) {
    res.status(500).send({message: "Unknown error"});
  }
});

surveysRouter.get("*", (req: Request, res: Response) => {
  res.status(404).send("Not found");
});
