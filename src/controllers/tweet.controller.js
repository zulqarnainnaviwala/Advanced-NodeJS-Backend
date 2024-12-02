import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const owner = req.user?._id;
    const { content } = req.body;

    // Validate owner
    if (!owner || !isValidObjectId(owner)) {
        throw new ApiError(400, "Missing or invalid owner ID.");
    }

    // Validate content
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required.");
    }

    try {
        // Create tweet
        const tweet = await Tweet.create({ owner, content: content.trim() });
        if (!tweet) {
            throw new ApiError(500, "Failed to create tweet. Please try again.");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, tweet, "Tweet created successfully."));
    } catch (error) {
        throw new ApiError(500, error?.message || "An unexpected error occurred while creating tweet.");
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId = req.user?._id
    const tweetId = req.params.tweetId?.trim();

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID.");
    }

    try {
        // Find the tweet and validate ownership
        const tweet = await Tweet.findById(tweetId).select("owner");
        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        if (userId.toString() !== tweet.owner.toString()) {
            throw new ApiError(403, "Unauthorized access to tweet");
        }

        // Delete the tweet
        const deleted = await Tweet.findByIdAndDelete(tweetId)
        if (!deleted) {
            throw new ApiError(400, "Failed to delete the tweet. Please try again later.")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, deleted, "tweet deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while deleting tweet.");
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}