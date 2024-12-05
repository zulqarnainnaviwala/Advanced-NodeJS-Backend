import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const addVideComment = asyncHandler(async (req, res) => {
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