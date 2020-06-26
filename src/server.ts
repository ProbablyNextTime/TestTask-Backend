import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"
import User from "./models/user";
import Survey, {SurveyInterface} from "./models/survey";
import {UserInterface} from "./models/user";
import JWT, {ExtractJwt} from "passport-jwt";
import passport from "passport";
import jwt from "jsonwebtoken"

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

// default endpoint
app.get("*", (req: Request, res: Response) => {
  res.status(200).send("Default endpoint");
});

// connecting to DB
connect("mongodb://localhost:27017/TestTask");

// starting server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});