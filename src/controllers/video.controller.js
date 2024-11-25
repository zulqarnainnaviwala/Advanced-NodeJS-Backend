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
    const videoId = req.params.videoId?.trim();
    if (!videoId.trim()) {
        throw new ApiError(400, "Video ID is required");
    }
    if (!isValidObjectId(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID");
    }

    try {
        // const video = await Video.findOne({ _id: videoId.trim(), $or: [{ owner: req.user._id }, { isPublished: true }] })
        //     .populate({
        //         path: 'owner',
        //         select: '-_id fullName avatar username' // Select fields from the owner (User model)
        //     });
        const video = await Video.aggregate([
            // Match the video based on its ID, and check if it is either owned by the user or published
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId),
                    $or: [
                        { owner: req.user?._id },
                        { isPublished: true }
                    ]
                }
            },
            // Populate the 'owner' information
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner',
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                isSubscribed: {
                                    $cond: {
                                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                        then: true,
                                        else: false
                                    }
                                },
                                subscribersCount: {
                                    $size: "$subscribers"
                                },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                fullName: 1,
                                username: 1,
                                subscribersCount: 1,
                                isSubscribed: 1,
                                avatar: 1,
                            }
                        },
                    ]
                }
            },
            {
                $unwind: '$owner' // Unwind the array to make it an object, as `owner` will be an array after $lookup
            },
            // // Add fields for like and dislike counts
            {
                $lookup: {
                    from: 'likes', // Assuming the 'Like' collection is named 'likes'
                    localField: '_id', // Match video _id from Video collection
                    foreignField: 'video', // Match video field in Like collection
                    as: 'likes' // Add result to a new 'likes' field
                }
            },
            {
                $lookup: {
                    from: 'dislikes', // Assuming the 'Dislike' collection is named 'dislikes'
                    localField: '_id', // Match video _id from Video collection
                    foreignField: 'video', // Match video field in Dislike collection
                    as: 'dislikes' // Add result to a new 'dislikes' field
                }
            },
            {
                $addFields: {
                    isLiked: {
                        $cond: {
                            if: { $in: [req.user?._id, "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
                    },
                    likesCount: { $size: '$likes' }, // Count the number of likes (length of the 'likes' array)
                    isDisliked: {
                        $cond: {
                            if: { $in: [req.user?._id, "$dislikes.dislikedBy"] },
                            then: true,
                            else: false
                        }
                    },
                    dislikesCount: { $size: '$dislikes' }, // Count the number of dislikes (length of the 'dislikes' array)
                }
            },
            {
                $project: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    owner: 1,
                    createdAt: 1,
                    likesCount: 1,
                    isLiked: 1,
                    dislikesCount: 1,
                    isDisliked: 1,
                }
            },
        ]);

        if (!video.length) {
            throw new ApiError(404, "Video not found or not available right now");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video[0], "video fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An unexpected error occurred while fetching the video");
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path
    if (!videoId.trim()) {
        throw new ApiError(400, "video id is required")
    }
    if (!isValidObjectId(videoId.trim())) {
        throw new ApiError(400, "invalid video id")
    }

    // Find the video by ID and check ownership
    const video = await Video.findOne({ _id: videoId.trim(), owner: req.user._id });
    if (!video) {
        // Video not found or not owned by the user
        throw new ApiError(404, "Video Not Found or Unauthaurized to Update Details");
    }

    if (
        [title, description, thumbnailLocalPath].every(field => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "At least one of title, description, or thumbnail is required to update");
    }

    if (title && (title !== video.title)) {
        video.title = title;
    }
    if (description && (description !== video.description)) {
        video.description = description;
    }

    let thumbnail;
    // upload new thumbnail
    if (thumbnailLocalPath) {
        console.log(true);
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }
    // if new upload fails
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail cloudinary file is required");
    }
    // destroy old thumbnail
    if (thumbnail?.url) {
        await destroyOnCloudinary(video.thumbnail);
    }

    try {
        if (title && (title !== video.title)) {
            video.title = title;
        }
        if (thumbnail.url && (thumbnail.url !== video.thumbnail)) {
            video.thumbnail = thumbnail.url;
        }

        const updated = await video.save();
        if (!updated) {
            throw new ApiError(400, "Error while updating video details");
        }
        return res.status(200).json(new ApiResponse(200, updated, "video info updated succesfully"));
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong while publishing video")
    }
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