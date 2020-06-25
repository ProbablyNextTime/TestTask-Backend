import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser"
import connect from "./DBConnection"

const app: Application = express();
const port: number = 3000 || process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// default endpoint
app.get("*", (req: Request, res: Response) => {
  res.send("Default endpoint");
});

// connecting to DB
connect("mongodb://localhost:27017/TestTask");

// starting server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});