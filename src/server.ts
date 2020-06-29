import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"
import User from "./models/user";
import {UserInterface} from "./models/user";
import jwt from "jsonwebtoken"
import { surveysRouter } from "./routes/survey"
import bcrypt from "bcrypt"
const dotenv = require('dotenv');
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 4000;

// Needed to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://compassionate-varahamihira-ae291d.netlify.app');
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Methods', ['PATCH', 'POST', 'GET', 'DELETE', 'PUT']);
  res.setHeader('Access-Control-Allow-Headers', ['Content-Type']);
  res.setHeader('Access-Control-Expose-Headers', ['Content-Type']);
  next();
});

// Defining subRoute for surveys
app.use("/api/surveys", surveysRouter);


// login user
app.post("/api/login", async (req: Request, res: Response) => {
  try {
    const user: UserInterface | null = await User.findOne({username: req.body.user.username});
    console.log(user, "dadaya")
    if(user && bcrypt.compareSync(req.body.user.password, user.password)) {
      // Sign jwt token
      const token = jwt.sign({user : user}, process.env.SECRET_KEY || "SECRET");

      if(token) {
        // If token created send user and accessToken
        res.status(200).send({user, accessToken: token});
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
    res.status(500).send({message: "Unknown error"})
  }
});

// SignUp newUser
app.post("/api//signUp", async (req: Request, res: Response) => {
  try {
    const user: UserInterface | null = await User.findOne({username: req.body.user.username})

    if(user) {
      // If such user already exists send corresponding message
      res.status(409).send({message: "such user exists"})
    } else {
      // Create new user
      const newUser: UserInterface = new User({
        username: req.body.user.username,
        password: bcrypt.hashSync(req.body.user.password, 10),
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
connect( `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@supercluster10k.qsysn.mongodb.net/SUperCLuster10k?retryWrites=true&w=majority`);

// starting server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});