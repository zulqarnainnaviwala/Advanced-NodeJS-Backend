import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { Dislike } from "../models/dislike.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;
    const viewsCount = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $group: {
                _id: "$owner",
                totalViews: { $sum: "$views", },
            },
        },
    ]);

    const subscribersCount = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $group: {
                _id: "$channel",
                totalSubscribers: { $sum: 1 },
            }
        },
    ]);

    const likeCount = await Like.aggregate([
        // Lookup video references
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        // Lookup comment references
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "comment"
            }
        },
        // Lookup tweet references
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet"
            }
        },
        // Match likes where the user has liked video, comment, or tweet
        {
            $match: {
                $or: [
                    { "video.owner": userId },  // Match if the video is owned by the user
                    { "comment.commentedBy": userId },  // Match if the comment was made by the user
                    { "tweet.owner": userId }  // Match if the tweet was posted by the user
                ]
            }
        },
        // Add fields to count the likes for each content type
        {
            $addFields: {
                videoLikes: { $cond: [{ $gt: [{ $size: "$video" }, 0] }, 1, 0] },  // Count likes for videos
                commentLikes: { $cond: [{ $gt: [{ $size: "$comment" }, 0] }, 1, 0] },  // Count likes for comments
                tweetLikes: { $cond: [{ $gt: [{ $size: "$tweet" }, 0] }, 1, 0] }  // Count likes for tweets
            }
        },
        // Group the results to calculate the total counts
        {
            $group: {
                _id: null,  // Group all the documents together
                videoLikes: { $sum: "$videoLikes" },
                commentLikes: { $sum: "$commentLikes" },
                tweetLikes: { $sum: "$tweetLikes" },
                totalLikes: { $sum: { $add: ["$videoLikes", "$commentLikes", "$tweetLikes"] } }  // Total likes
            }
        }
    ]);

    const dislikeCount = await Dislike.aggregate([
        // Lookup video references
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        // Lookup comment references
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "comment"
            }
        },
        // Lookup tweet references
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet"
            }
        },
        // Match likes where the user has liked video, comment, or tweet
        {
            $match: {
                $or: [
                    { "video.owner": userId },  // Match if the video is owned by the user
                    { "comment.commentedBy": userId },  // Match if the comment was made by the user
                    { "tweet.owner": userId }  // Match if the tweet was posted by the user
                ]
            }
        },
        // Add fields to count the likes for each content type
        {
            $addFields: {
                videoDislikes: { $cond: [{ $gt: [{ $size: "$video" }, 0] }, 1, 0] },  // Count likes for videos
                commentDislikes: { $cond: [{ $gt: [{ $size: "$comment" }, 0] }, 1, 0] },  // Count likes for comments
                tweetDislikes: { $cond: [{ $gt: [{ $size: "$tweet" }, 0] }, 1, 0] }  // Count likes for tweets
            }
        },
        // Group the results to calculate the total counts
        {
            $group: {
                _id: null,  // Group all the documents together
                videoDislikes: { $sum: "$videoDislikes" },
                commentDislikes: { $sum: "$commentDislikes" },
                tweetDislikes: { $sum: "$tweetDislikes" },
                totalDislikes: { $sum: { $add: ["$videoDislikes", "$commentDislikes", "$tweetDislikes"] } }  // Total likes
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            totalViews: viewsCount[0].totalViews,
            totalSubscribers: subscribersCount[0].totalSubscribers,
            totalLikes: likeCount[0].totalLikes,
            videoLikes: likeCount[0].videoLikes,
            commentLikes: likeCount[0].commentLikes,
            tweetLikes: likeCount[0].tweetLikes,
            totalDislikes: dislikeCount[0].totalDislikes,
            videoDislikes: dislikeCount[0].videoDislikes,
            commentDislikes: dislikeCount[0].commentDislikes,
            tweetDislikes: dislikeCount[0].tweetDislikes
        }, "Channel Stats Fetched"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
});

export {
    getChannelStats,
    getChannelVideos
}