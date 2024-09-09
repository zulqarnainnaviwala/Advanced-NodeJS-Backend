// require('dotenv').config({path: './env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv"; //add this in dev script to make this syntax work : -r dotenv/config --experimental-json-modules

dotenv.config({
  path: "./env",
});
connectDB();

/*
// connect db using  IIFE (Immediately Invoked Function Expression) 
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()
*/
