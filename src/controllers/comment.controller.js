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

const getVideoComments = asyncHandler(async (req, res) => {
})

const addTweetComment = asyncHandler(async (req, res) => {
})

const getTweetComments = asyncHandler(async (req, res) => {
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