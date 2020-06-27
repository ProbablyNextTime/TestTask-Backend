import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"
import User from "./models/user";
import Survey, {SurveyInterface} from "./models/survey";
import {UserInterface} from "./models/user";
import JWT, {ExtractJwt} from "passport-jwt";
import passport from "passport";
import jwt from "jsonwebtoken"
import {isValidObjectId, Schema} from "mongoose";
import mongoose from "mongoose"

const app: Application = express();
const port: number = 4000 || process.env.PORT;

// Needed to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const opts: JWT.StrategyOptions = {
  // Defining a way to get auth token
  jwtFromRequest: JWT.ExtractJwt.fromAuthHeaderAsBearerToken(),

  secretOrKey:'secret',
}

// Strategy for auth with verify function
passport.use(new JWT.Strategy(opts, function(payload, done) {
    User.findOne({username: payload.user.username}, function(err: Error, user: UserInterface) {
        if (err) {
            // handling getting user errors
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

// Middleware that checks if request was made by admin
function checkAdmin(req: Request, res: Response, next: NextFunction) {
     if (req.user && req.user.role === "admin")
        return next();

    res.status(403).send("Forbiden");
}



// login user
app.post("/login", async (req: Request, res: Response) => {
  try {
    const user: UserInterface | null = await User.findOne({username: req.body.user.username});

    if(user && user.password === req.body.user.password) {
      // Sign jwt token
      const token = await jwt.sign({user : user}, "secret");

      if(token) {
        // If token created send user and accessToken
        res.status(200).json({user, accessToken: token});
      } else {
        // If token wasn`t created send corresponding message
        res.status(500).send({user: null, message: "Jwt setting failed"});
      }
    }
    else {
      // If users data doesn`t match send corresponding message
      res.status(400).send({user: null, message: "Incorrect data"})
    }
  } catch (err) {
    console.log(err); // TODO: Error handling
  }
});

// SignUp newUser
app.post("/signUp", async (req: Request, res: Response) => {
  try {
    const user: UserInterface | null = await User.findOne({username: req.body.user.username})

    if(user) {
      // If such user already exists send corresponding message
      res.status(400).send({message: "such user exists"})
    } else {
      // Create new user
      const newUser: UserInterface = new User({
        username: req.body.user.username,
        password: req.body.user.password,
        role: "user",
    })

      await newUser.save()
      res.status(200).send({user});
    }
  } catch (err) {
    console.log(err); // TODO: Error handling
    res.send(500).send({message: "Unknown server error"});
  }
})

app.use(passport.authenticate("jwt", {session: false}));

//Create survey endpoint
app.post("/createSurvey", checkAdmin, async (req: Request, res: Response) => {
  try {
    // Try to get survey to check if survey with such tittle already exists
    const survey: SurveyInterface | null = await Survey.findOne({tittle: req.body.tittle});

    // If survey with such tittle exists send corresponding message
    if(survey) {
      res.status(400).send({message: "such tittle already exists"});
      return;
    }

    // Check if survey questions array is not empty
    if(req.body.questions.length !== 0) {
       const newSurvey = new Survey({
        questions: req.body.questions,
        tittle: req.body.tittle,
       })

      // Save new survey to DB
       await newSurvey.save();
       res.status(200).send({message: "Created"})

    } else {
      res.status(400).send({message: "Mo questions were provided"})
    }

  } catch (error) {
    res.status(500).send({message: "Unknown server error"}) // TODO: Error handling
  }
});


// Get all user`s uncompleted surveys
app.get("/surveys", async (req: Request, res: Response) => {
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
app.get("/survey/", async (req: Request, res: Response) => {
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
app.post("/postSurvey/", async (req: Request, res: Response) => {
  try {
    // get user from DB
    const user: UserInterface | null = await User.findOne({_id: req.user?._id}).populate("completedSurveys");
    if(user) {
        // Check if survey id is valid Object ID
        if(isValidObjectId(req.body.surveyId)) {
          // Get completed surveys Ids
          const completedSurveys: mongoose.Types.ObjectId[] = user.completedSurveys.map( survey => survey.surveyId );

          if(!completedSurveys.find((surveyId) => surveyId === req.body.surveyId )) {
            user.completedSurveys.push({surveyId: req.body.surveyId, answers: req.body.answers});
            await User.updateOne({_id: req.user?._id}, user)
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

// default endpoint
app.get("*", (req: Request, res: Response) => {
  res.status(404).send("Not found");
});

// connecting to DB
connect("mongodb://localhost:27017/TestTask");

// starting server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});