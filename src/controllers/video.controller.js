import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished = false, views = 0 } = req.body;
    const owner = req.user._id;
    let duration;

    if (
        [title, description].some(field => field?.trim() === "" || !field)
    ) {
        throw new ApiError(400, "Title and description are required");
    }

    // TODO: get video, upload to cloudinary, create video
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }
    let videoFileLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoFileLocalPath = req.files.videoFile[0].path;
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail Local file is required");
    }
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video File Local file is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary.");
    }
    if (!videoFile) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary.");
    }

    try {
        const video = await Video.create({
            videoFile: videoFile?.url,
            thumbnail: thumbnail?.url,
            owner,
            title,
            description,
            duration: videoFile.duration,
            views,
            isPublished
        });
        return res.status(201).json(new ApiResponse(201, video, "Video created successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while publishing the video.");
    }
})

// getAllVideos Optmised/Refactored Version
const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, userId, query, sortBy = "createdAt", sortType = "asc", } = req.query

    if (!userId || !userId.trim()) {
        throw new ApiError(400, "User ID is required in the query parameters.");
    }
    if (!isValidObjectId(userId.trim())) {
        throw new ApiError(400, "Invalid User ID format.");
    }

    // This way, page will default to 1 (if parseInt returns NaN), 
    // limit will default to 10 (if parseInt returns NaN), 
    // and any value above limit 50 will be limited to 50.
    page = Math.max(1, parseInt(page, 10) || 1); // Ensures page is at least 1
    limit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50); // Ensures limit is between 1 and 50

    const pipeline = [];
    userId = new mongoose.Types.ObjectId(userId.trim());

    const matchConditions = [
        { $eq: ["$owner", userId] },
        { $or: [{ $eq: [userId, req.user._id] }, { $eq: ["$isPublished", true] }] }
    ];

    if (query) {
        // Try Below with query = "      abc  yourSearchingWord  etc     unique"
        // const search = query.trim().split(" ").filter(term => term !== "");
        // if (search.length > 0) {
        //     // Create regex queries for each search term
        //     const regexQueries = search.map(term => ({
        //         $or: [
        //             { title: { $regex: term, $options: 'i' } },
        //             { description: { $regex: term, $options: 'i' } }
        //         ]
        //     }));

        //     // Push the regex queries into the match conditions using $and
        //     matchConditions.push({ $or: regexQueries });
        // }

        matchConditions.push({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });
    }

    pipeline.push({ $match: { $expr: { $and: matchConditions } } });

    if (sortBy && sortType) {
        const sortOrder = sortType === "asc" ? 1 : -1;
        pipeline.push(
            { $sort: { [sortBy]: sortOrder } }
        )
    }
    if (page && limit) {
        pipeline.push(
            // Remove the skip and limit from the pipeline
            // aggregatePaginate will handle these internally

            // { $skip: (page - 1) * limit },
            // { $limit: limit },

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
                                avatar: 1,
                            }
                        },

                    ],
                },
            },
            {
                $unwind: {
                    'path': '$owner',
                    'preserveNullAndEmptyArrays': false,
                },
            }
        )
    }

    if (!pipeline.length) {
        throw new ApiError(400, "Error occurred while preparing the aggregation pipeline.");
    }

    try {
        const result = await Video.aggregatePaginate(pipeline, { page, limit });
        return res.status(200).json(
            new ApiResponse(200, {
                success: true,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                totalResults: result.totalDocs,
                videos: result.docs
            }, "Videos fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, error?.message || "Error occurred while executing the aggregation pipeline.");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}