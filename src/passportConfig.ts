import JWT from "passport-jwt";
import passport, {PassportStatic, Strategy} from "passport";
import User, {UserInterface} from "./models/user";
import {NextFunction, Request, Response} from "express";

const opts: JWT.StrategyOptions = {
  // Defining a way to get auth token
  jwtFromRequest: JWT.ExtractJwt.fromAuthHeaderAsBearerToken(),

  secretOrKey:'secret',
}

// Strategy for auth with verify function

const jwtStrategy: Strategy = new JWT.Strategy(opts, function(payload, done) {
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
})

export const passportInitialize = (passport: PassportStatic) =>  passport.use(jwtStrategy);

// Middleware that checks if request was made by admin
export function checkAdmin(req: Request, res: Response, next: NextFunction) {
     if (req.user && req.user.role === "admin")
        return next();

    res.status(403).send("Forbiden");
}

