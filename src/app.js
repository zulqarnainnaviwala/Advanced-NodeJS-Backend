import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//Allowed frontend origins in our app
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//parse json to js-object and limit size
app.use(express.json({ limit: "16kb" }));
//parse url encoding and limit size
// example: https://www.google.com/search?q=zulqarnain+naviwala
// In URL encoding, spaces are represented by + or %20. In your URL, the space between zulqarnain and naviwala is encoded as +.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// This middleware function tells Express to serve static files (like HTML, CSS, JavaScript, images) from the public folder.
app.use(express.static("public"));
//Allows you to read cookies sent with client requests
app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js'
import playlistRouter from "./routes/playlist.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import dislikeRouter from "./routes/dislike.routes.js"
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/dislike", dislikeRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

// http://localhost:8000/api/v1/users/"register|login|..."

export { app };
