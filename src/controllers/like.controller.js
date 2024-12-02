import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to toggle like (generalized for video, comment, tweet)
const toggleLike = async (contentType, contentId, userId, session) => {
  let like, dislike;
  // 2. Check if the user has already disliked the content and delete the dislike if it exists
  const existingDislike = await Dislike.findOne({
    [contentType]: contentId,
    dislikedBy: userId,
  }).session(session);

  if (existingDislike) {
    // Delete the dislike
    await Dislike.findOneAndDelete({
      [contentType]: contentId,
      dislikedBy: userId,
    }).session(session);  // Delete the dislike

    dislike = false;
  }

  // 3. Check if the user has already liked the content and delete the like if it exists
  const existingLike = await Like.findOne({
    [contentType]: contentId,
    likedBy: userId,
  }).session(session);

  if (existingLike) {
    // If the like exists, remove it
    await Like.findOneAndDelete({
      [contentType]: contentId,
      likedBy: userId,
    }).session(session);
    like = false;
    return { like, dislike };  // Like was removed
  }

  // 4. If no existing like, create a new like
  const newLike = new Like({
    [contentType]: contentId,
    likedBy: userId,
  });

  await newLike.save({ session });  // Save the new like within the session
  like = true;

  return { like, dislike };  // Like was added
};

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "user id is required")
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid user id")
  }
  if (!videoId || !videoId.trim()) {
    throw new ApiError(400, "video id is required")
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id")
  }

  const video = await Video.findOne({ _id: videoId, $or: [{ owner: req.user._id }, { isPublished: true }] });
  if (!video) {
    throw new ApiError(404, "Video not found or not available right now")
  }

  // Start a session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { like, dislike = false } = await toggleLike("video", videoId, userId, session);

    await session.commitTransaction();  // Commit the transaction after the like toggle

    return res.status(200).json(
      new ApiResponse(200, { like, dislike }, like ? "Video liked." : "Video unliked.")
    );
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new ApiError(error.statusCode ? error.statusCode : 500, error.message ? error.message : "Something went wrong while toggling video like.");
  } finally {
    // End the session whether it's committed or aborted
    session.endSession();
  }
});

// Toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
});

// Toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
});

// Get all liked videos by the current user
const getLikedVideos = asyncHandler(async (req, res) => {
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };