import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {

    const owner = req.user?._id;
    const { name, description } = req.body;

    // Check for missing or empty fields
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Both 'name' and 'description' are required to create a playlist.");
    }

    // Check for duplicate playlist
    const existingPlaylist = await Playlist.findOne({ name: name.trim(), owner });
    if (existingPlaylist) {
        throw new ApiError(400, "A playlist with this name already exists.");
    }

    try {
        // Create playlist
        const playlist = await Playlist.create({
            name: name.trim(),
            description: description.trim(),
            owner
        });

        if (!playlist) {
            throw new ApiError(500, "Failed to create playlist due to a server error.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlist, "playlist created successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An unexpected error occurred while creating the playlist.");
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {

    const userId = req.params.userId?.trim();
    if (!userId) {
        throw new ApiError(400, "User ID is required.");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID.");
    }

    // Ensure the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
        throw new ApiError(404, "User not found.");
    }

    try {
        const playlists = await Playlist.aggregate([
            {
                $match: { owner: new mongoose.Types.ObjectId(userId) },
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'videos',
                    foreignField: '_id',
                    as: 'videos',
                    pipeline: [
                        {
                            $match: {
                                $or: [
                                    { isPublished: true },
                                    { owner: req.user._id }
                                ]
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                owner: 1,
                                thumbnail: 1,
                                isPublished: 1,
                                views: 1
                            }
                        }
                    ]
                },
            },
            {
                $addFields: {
                    videosCount: { $size: "$videos" },
                    totalViewsOfAllVideos: { $sum: "$videos.views" }
                }
            }
        ])

        if (!playlists || playlists.length === 0) {
            throw new ApiError(404, "No playlists found for the specified user.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlists, "playlists fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An unexpected error occurred while fetching playlists.");
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId?.trim();
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required.");
    }
    if (!isValidObjectId(playlistId.trim())) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    try {
        const playlist = await Playlist.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(playlistId) },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: '_id',
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: { $size: "$subscribers" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                                subscribersCount: 1,
                            }
                        },
                    ]
                },
            },
            {
                $unwind: {
                    'path': '$owner',
                    'preserveNullAndEmptyArrays': false,
                },
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'videos',
                    foreignField: '_id',
                    as: 'videos',
                    pipeline: [
                        {
                            $match: {
                                $or: [
                                    { isPublished: true },
                                    { owner: req.user?._id }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'owner',
                                foreignField: '_id',
                                as: 'owner',
                            }
                        },
                        {
                            $unwind: {
                                path: '$owner',
                                preserveNullAndEmptyArrays: true // Optional
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                thumbnail: 1,
                                duration: 1,
                                title: 1,
                                views: 1,
                                createdAt: 1,
                                isPublished: 1,
                                owner: {
                                    username: '$owner.username',
                                    fullName: '$owner.fullName',
                                    avatar: '$owner.avatar'
                                }
                            }
                        },
                    ],
                },
            },
            {
                $addFields: {
                    videosCount: { $size: "$videos" },
                    totalViewsOfAllVideos: { $sum: "$videos.views" }
                }
            },
        ])

        // Handle empty results
        if (!playlist || playlist.length === 0) {
            throw new ApiError(404, "Playlist not found.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlist, "playlist fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "An unexpected error occurred while fetching the playlist.");
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const playlistId = req.params.playlistId?.trim();
    const videoId = req.params.videoId?.trim();

    // Validate inputs
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are both required.");
    }
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID.");
    }

    try {
        // Check if the user is the owner of the playlist
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(400, "Playlist doesn't exist.");
        }
        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "Unauthorized access to playlist.");
        }

        // Check video accessibility
        const video = await Video.findOne(
            {
                _id: videoId,
                $or: [{ owner: userId }, { isPublished: true }],
            },
            { _id: 1 } // Project only required fields
        );
        if (!video) {
            throw new ApiError(404, "Video not found or not accessible.");
        }

        // Add video to playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $addToSet: { videos: videoId } }, // Prevent duplicates
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully.")
            );
    } catch (error) {
        console.error("Error adding video to playlist:", error);
        throw new ApiError(500, error?.message || "An unexpected error occurred while adding video to the playlis.");
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const playlistId = req.params.playlistId?.trim();
    const videoId = req.params.videoId?.trim();

    // Validate inputs
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are both required.");
    }
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID.");
    }

    try {
        // Check ownership and existence of the playlist
        const playlist = await Playlist.findById(playlistId).select("owner videos");
        if (!playlist) {
            throw new ApiError(404, "Playlist not found.");
        }
        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "You are not authorized to modify this playlist.");
        }

        // Check if the video exists in the playlist
        if (!playlist.videos.includes(videoId)) {
            throw new ApiError(404, "Video not found in the playlist.");
        }

        // Remove the video from the playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiError(500, "Failed to update the playlist.");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully."));
    } catch (error) {
        console.error("Error removing video from playlist:", error);
        throw new ApiError(500, error?.message || "An unexpected error occurred while removing video from playlist.");
    }
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const playlistId = req.params.playlistId?.trim();

    // Validate input
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required.");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    try {
        // Check ownership and existence of the playlist
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(404, "Playlist not found.");
        }
        if (!userId.equals(playlist.owner)) {
            throw new ApiError(403, "You are not authorized to delete this playlist.");
        }

        // Delete the playlist
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        if (!deletedPlaylist) {
            throw new ApiError(500, "Playlist deletion failed. Please try again.");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully."));
    } catch (error) {
        console.error("Error deleting playlist:", error);
        throw new ApiError(500, error?.message || "An unexpected error occurred.");
    }
});


const updatePlaylist = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const playlistId = req.params?.playlistId?.trim();
    const { name, description } = req.body;

    // Validate inputs
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required.");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }
    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "Either 'name' or 'description' must be provided.");
    }

    try {
        // Find and verify ownership
        const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });
        if (!playlist) {
            throw new ApiError(403, "You are not authorized to update this playlist or it does not exist.");
        }

        // Update playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name: name?.trim() || playlist.name,
                    description: description?.trim() || playlist.description,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedPlaylist) {
            throw new ApiError(500, "Failed to update playlist. Please try again.");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedPlaylist, "Playlist info updated successfully."));
    } catch (error) {
        console.error("Error updating playlist:", error);
        throw new ApiError(500, error?.message || "An unexpected error occurred.");
    }
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}