import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const addVideComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId = req.params.videoId?.trim();
    const { content } = req.body;
    const commentedBy = req.user._id

    if (!videoId) {
        throw new ApiError(400, "video id is required");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id");
    }
    if (!content || !content?.trim()) {
        throw new ApiError(400, "content is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    try {
        const comment = await Comment.create({
            content,
            video: videoId,
            commentedBy
        });

        if (!comment) {
            throw new ApiError(500, "Failed to create comment");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment added successfully")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "An error accured while adding the comment");
    }
})

//with aggregatePaginate (mongoose-aggregate-paginate-v2) 
const getVideoComments = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId?.trim();
    let { page = 1, limit = 10, sortBy = "createdAt", sortType = "asc" } = req.query

    if (!videoId || !videoId.trim()) {
        throw new ApiError(400, "video id is required")
    }
    if (!isValidObjectId(videoId.trim())) {
        throw new ApiError(400, "invalid video id")
    }

    // Sanitize and validate pagination and sorting inputs
    page = Math.max(1, parseInt(page, 10) || 1); // Ensures page is at least 1
    limit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50); // Ensures limit is between 1 and 50

    const allowedSortFields = ["createdAt", "updatedAt"];
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, `Invalid sortBy field. Allowed fields: ${allowedSortFields.join(", ")}`);
    }

    const sortOrder = sortType === "asc" ? 1 : -1;

    const pipeline = [
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$commentedBy",
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "comment",
                as: "dislikes",
            },
        },
        {
            $addFields: {
                isLiked: {
                    $in: [req.user?._id, "$likes.likedBy"],
                },
                likesCount: { $size: "$likes" },
                isDisliked: {
                    $in: [req.user?._id, "$dislikes.dislikedBy"],
                },
                dislikesCount: { $size: "$dislikes" },
            },
        },
        {
            $sort: { [sortBy]: sortOrder },
        },
        {
            $project: {
                _id: 1,
                content: 1,
                video: 1,
                commentedBy: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                dislikesCount: 1,
                isDisliked: 1,
            },
        },
    ];

    try {
        const result = await Comment.aggregatePaginate(pipeline, { page, limit });

        if (!result.docs || result.docs.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "No comments found for this video")
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                    totalResults: result.totalDocs,
                    comments: result.docs,
                }, "Comments fetched successfully")
            );
    } catch (error) {
        throw new ApiError(500, error?.message || "An error accured while fetching comments");
    }
})

//without aggregatePaginate (mongoose-aggregate-paginate-v2)
// const getvideoComments = asyncHandler(async (req, res) => {
//     //TODO: get all comments for a video
//     const { videoId } = req.params
//     const { page = 1, limit = 10 } = req.query

//     if (!mongoose.Types.ObjectId.isValid(videoId)) {
//         throw new ApiError(400, "Invalid video ID");
//     }

//     const comments = await Comment.aggregate([
//         { $match: { video: new mongoose.Types.ObjectId(videoId) } },
//         { $sort: { createdAt: -1 } },
//         {
//             $facet: {
//                 metadata: [{ $count: "total" }, { $addFields: { page: parseInt(page) } }],
//                 data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
//             },
//         },
//         { $unwind: "$metadata" }
//     ]);

//     const response = {
//         comments: comments.length > 0 ? comments[0].data : [],
//         totalPages: comments.length > 0 ? Math.ceil(comments[0].metadata.total / limit) : 0,
//         currentPage: parseInt(page)
//     };

//     res.status(200).json(new ApiResponse(200, response, "Comments retrieved successfully"));

// })

const addTweetComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a tweet
    const tweetId = req.params.tweetId?.trim();
    const { content } = req.body;
    const commentedBy = req.user._id

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }
    if (!content || !content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    // Check if the tweet exists
    const tweet = await Tweet.findById(tweetId).lean(); //.lean() for faster read-only operations
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    try {
        // Create the comment
        const comment = await Comment.create({
            content: content.trim(),
            tweet: tweetId,
            commentedBy,
        });

        if (!comment) {
            throw new ApiError(500, "Failed to create the comment");
        }

        // Success response
        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment added successfully")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while adding the comment");
    }
})

const getTweetComments = asyncHandler(async (req, res) => {

    const tweetId = req.params.tweetId?.trim();
    let { page = 1, limit = 10, sortBy = "createdAt", sortType = "asc" } = req.query

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    // Sanitize and validate pagination and sorting inputs
    page = Math.max(1, parseInt(page, 10) || 1); // Ensures page is at least 1
    limit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50); // Ensures limit is between 1 and 50

    const allowedSortFields = ["createdAt", "updatedAt"];
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, `Invalid sortBy field. Allowed fields: ${allowedSortFields.join(", ")}`);
    }

    const pipeline = [
        // Match comments by tweet ID
        {
            $match: { tweet: new mongoose.Types.ObjectId(tweetId) }
        },
        // Sort comments by specified field
        {
            $sort: { [sortBy]: sortOrder }
        },
        // Populate commentedBy user details
        {
            $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: "$commentedBy", preserveNullAndEmptyArrays: false } },
        // Fetch likes and dislikes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "comment",
                as: "dislikes",
            },
        },
        // Add fields for like/dislike counts and user-specific actions
        {
            $addFields: {
                isLiked: {
                    $cond: { if: { $in: [req.user?._id, "$likes.likedBy"] }, then: true, else: false },
                },
                likesCount: { $size: "$likes" },
                isDisliked: {
                    $cond: { if: { $in: [req.user?._id, "$dislikes.dislikedBy"] }, then: true, else: false },
                },
                dislikesCount: { $size: "$dislikes" },
            },
        },
        // Select final fields
        {
            $project: {
                _id: 1,
                content: 1,
                tweet: 1,
                commentedBy: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                dislikesCount: 1,
                isDisliked: 1,
            },
        },
    ];

    try {
        const result = await Comment.aggregatePaginate(pipeline, { page, limit });

        if (!result.docs || result.docs.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "No comments found for this Tweet")
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    success: true,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                    totalResults: result.totalDocs,
                    comments: result.docs,
                }, "Comments fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while fetching Tweet comments");
    }
})

const updateComment = asyncHandler(async (req, res) => {
})

const deleteComment = asyncHandler(async (req, res) => {
})

export {
    addVideComment,
    getVideoComments,
    addTweetComment,
    getTweetComments,
    deleteComment,
    updateComment,
}