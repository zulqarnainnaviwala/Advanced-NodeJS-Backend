import { Router } from 'express';
import {
    toggleVideoDislike,
    toggleTweetDislike,
    toggleCommentDislike,
} from "../controllers/dislike.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/toggle/v/:videoId").post(toggleVideoDislike);
router.route("/toggle/c/:commentId").post(toggleCommentDislike);
router.route("/toggle/t/:tweetId").post(toggleTweetDislike);

export default router