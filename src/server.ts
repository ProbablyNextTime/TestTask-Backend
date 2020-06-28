import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"
import User from "./models/user";
import {UserInterface} from "./models/user";
import jwt from "jsonwebtoken"
import { surveysRouter } from "./routes/survey"

const app: Application = express();
const port: number = 4000 || process.env.PORT;

// Needed to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Defining subRoute for surveys
app.use("/surveys", surveysRouter);

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
        // If token wasn't created send corresponding message
        res.status(500).send({user: null, message: "Jwt setting failed"});
      }
    }
    else {
      // If users data doesn't match send corresponding message
      res.status(400).send({user: null, message: "Incorrect login or password"})
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
      res.status(409).send({message: "such user exists"})
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
    res.send(500).send({message: "Unknown server error"});
  }
})

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