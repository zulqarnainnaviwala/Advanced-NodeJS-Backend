import { Router } from 'express';
import {
    addVideComment,
    getVideoComments,
    getTweetComments,
    addTweetComment,
    deleteComment,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/v/:videoId").get(getVideoComments).post(addVideComment);
router.route("/t/:tweetId").get(getTweetComments).post(addTweetComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
export default router