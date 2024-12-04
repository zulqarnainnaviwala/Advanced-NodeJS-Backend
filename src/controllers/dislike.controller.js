import mongoose from 'mongoose';
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to toggle dislike (generalized for video, comment, tweet)
const toggleDislike = async (contentType, contentId, userId, session) => {
    let dislike, like;
    // 2. Check if the user has already disliked the content and delete the dislike if it exists
    const existingLike = await Like.findOne({
        [contentType]: contentId,
        likedBy: userId,
    }).session(session);

    if (existingLike) {
        // Delete the dislike
        await Like.findOneAndDelete({
            [contentType]: contentId,
            likedBy: userId,
        }).session(session);  // Delete the dislike

        like = false;
    }

    // 3. Check if the user has already liked the content and delete the like if it exists
    const existingDislike = await Dislike.findOne({
        [contentType]: contentId,
        dislikedBy: userId,
    }).session(session);

    if (existingDislike) {
        // If the like exists, remove it
        await Dislike.findOneAndDelete({
            [contentType]: contentId,
            dislikedBy: userId,
        }).session(session);
        dislike = false;
        return { dislike, like };  // Like was removed
    }

    // 4. If no existing like, create a new like
    const newDislike = new Dislike({
        [contentType]: contentId,
        dislikedBy: userId,
    });

    await newDislike.save({ session });  // Save the new like within the session
    dislike = true;

    return { dislike, like };  // Like was added
};

// Toggle dislike for a video
const toggleVideoDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ _id: videoId.trim(), $or: [{ owner: req.user._id }, { isPublished: true }] });
    if (!video) {
        throw new ApiError(404, "Video not found or not available right now")
    }

    // Start a session to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { dislike, like = false } = await toggleDislike("video", videoId, userId, session);

        await session.commitTransaction();  // Commit the transaction after the like toggle

        return res.status(200).json(
            new ApiResponse(200, { like, dislike }, dislike ? "Video disliked." : "Video un-disliked.")
        );
    } catch (error) {
        // If an error occurs, abort the transaction
        await session.abortTransaction();
        throw new ApiError(error.statusCode ? error.statusCode : 500, error.message ? error.message : "Something went wrong while toggling video dislike.");
    } finally {
        // End the session whether it's committed or aborted
        session.endSession();
    }
});

// Toggle dislike for a comment
const toggleCommentDislike = asyncHandler(async (req, res) => {
});

// Toggle dislike for a video
const toggleTweetDislike = asyncHandler(async (req, res) => {
});

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike };
