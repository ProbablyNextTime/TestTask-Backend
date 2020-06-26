import mongoose from "mongoose";

// Wrapper for DB connection
export default (db: string) => {
  const connect = () => {
    mongoose
      .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        return console.log(`Successfully connected to ${db}`);
      })
      .catch(error => {
        console.log("Error connecting to database: ", error);
        return process.exit(1);
      });
  };
  connect();

  // reconnect on disconnecting
  mongoose.connection.on("disconnected", connect);
};