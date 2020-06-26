import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"
import User from "./models/user";
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

      if(await newUser.save())
        // If user added to DB send created user
        res.status(200).send({user});
      else
        // If user wasn`t added to DB send corresponding message
        res.status(500).send({message: "Unable to create user"})
    }
  } catch (err) {
    console.log(err); // TODO: Error handling
    res.send(500).send({message: "Unknown server error"});
  }
})

app.use(passport.authenticate("jwt", {session: false}));

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