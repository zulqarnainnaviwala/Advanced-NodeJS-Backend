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

    const userId = req.params.userId?.trim();

    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid or missing user ID.");
    }
    try {
        // const tweets = await Tweet.find({ owner: userId });
        const tweets = await Tweet.aggregate([
            {
                $match: { owner: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: "$owner", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "dislikes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "dislikes"
                }
            },
            {
                $addFields: {
                    isLiked: { $in: [req.user?._id, "$likes.likedBy"] },
                    likesCount: { $size: "$likes" },
                    isDisliked: { $in: [req.user?._id, "$dislikes.dislikedBy"] },
                    dislikesCount: { $size: "$dislikes" }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    thumbnail: 1,
                    owner: 1,
                    createdAt: 1,
                    likesCount: 1,
                    isLiked: 1,
                    dislikesCount: 1,
                    isDisliked: 1
                }
            },
        ])

        if (!tweets || tweets.length === 0) {
            return res
                .status(404)
                .json(new ApiResponse(404, [], "No tweets found for the user."));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, tweets, "User tweets fetched successfully.")
            );
    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while fetching user tweets.");
    }
})

const updateTweet = asyncHandler(async (req, res) => {

    const tweetId = req.params.tweetId?.trim();
    let { content } = req.body;

    // Validate tweetId
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required.");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID.");
    }

    // Validate content
    if (!content || !content?.trim()) {
        throw new ApiError(400, "New tweet content is required to update.");
    }

    try {
        // Find the tweet
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new ApiError(404, "Tweet not found.");
        }

        // Check ownership
        if (!tweet.owner.equals(req.user?._id)) {
            throw new ApiError(403, "You are not authorized to update this tweet.");
        }
        // Update the tweet
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            { $set: { content: content.trim() || tweet.content } },
            { new: true, runValidators: true }
        );

        if (!updatedTweet) {
            throw new ApiError(500, "Failed to update the tweet. Please try again later.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedTweet, "Tweet updated successfully.")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while updating the tweet.");
    }
});


const deleteTweet = asyncHandler(async (req, res) => {

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