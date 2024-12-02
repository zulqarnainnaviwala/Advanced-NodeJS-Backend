import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
});

const toggleCommentLike = asyncHandler(async (req, res) => {
});

const toggleTweetLike = asyncHandler(async (req, res) => {
});

// Get all liked videos by the current user
const getLikedVideos = asyncHandler(async (req, res) => {
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };