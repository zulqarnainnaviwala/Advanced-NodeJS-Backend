import mongoose from 'mongoose';
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle dislike for a video
const toggleVideoDislike = asyncHandler(async (req, res) => {
});

// Toggle dislike for a comment
const toggleCommentDislike = asyncHandler(async (req, res) => {
});

// Toggle dislike for a video
const toggleTweetDislike = asyncHandler(async (req, res) => {
});

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike };
