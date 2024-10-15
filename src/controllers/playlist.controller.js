import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const isUserOwnerofPlaylist = async (playlistId, userId) => {
    try {
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(400, "playlist doesn't exist")
        }
        if (userId.equals(playlist.owner)) {
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        throw new ApiError(400, error.message)
    }
}

const createPlaylist = asyncHandler(async (req, res) => {

    const owner = req.user._id;
    const { name, description } = req.body;

    if ([name, description].some(field => field?.trim() === "" || !field)) {
        throw new ApiError(400, "Playlist name & description are required")
    }

    //create playlist
    const playlist = await Playlist.create({ name, description, owner })
    if (!playlist) {
        throw new ApiError(400, "Error while creating playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist created successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {

    const { userId } = req.params;
    if (!userId.trim()) {
        throw new ApiError(400, "user id is required")
    }
    if (!isValidObjectId(userId.trim())) {
        throw new ApiError(400, "invalid user id")
    }

    //get user playlists
    const playlists = await Playlist.find({ owner: userId.trim() })
    if (!playlists) {
        throw new ApiError(400, "Error while getting user playlists")
    }
    //TODO: AGGREGATION PIPELINE TO MAP VIDEOS INFO

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "playlists fetched successfully")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {

    const { playlistId } = req.params
    if (!playlistId.trim()) {
        throw new ApiError(400, "playlist id is required")
    }
    if (!isValidObjectId(playlistId.trim())) {
        throw new ApiError(400, "invalid playlist id")
    }

    //get playlist by id
    const playlist = await Playlist.findById(playlistId.trim())
    if (!playlist) {
        throw new ApiError(400, "Error while getting playlist")
    }
    //TODO: AGGREGATION PIPELINE TO MAP VIDEOS INFO

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { playlistId, videoId } = req.params

    if (!playlistId.trim() || !videoId.trim()) {
        throw new ApiError(400, "playlist id and video id both required")
    }
    if (!isValidObjectId(playlistId.trim()) || !isValidObjectId(videoId.trim())) {
        throw new ApiError(400, "invalid playlist or video id")
    }

    //is user owner of the playlist
    const userOwner = await isUserOwnerofPlaylist(playlistId, userId)
    if (!userOwner) {
        throw new ApiError(300, "Unauthorized access to playlist")
    }

    //add video to playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // addToSet: Avoid duplicates
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while adding video on playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { playlistId, videoId } = req.params
    if (!playlistId.trim() || !videoId.trim()) {
        throw new ApiError(400, "playlist id and video id both required")
    }
    if (!isValidObjectId(playlistId.trim()) || !isValidObjectId(videoId.trim())) {
        throw new ApiError(400, "invalid playlist or video id")
    }

    //is user owner of the playlist
    const userOwner = await isUserOwnerofPlaylist(playlistId, userId)
    if (!userOwner) {
        throw new ApiError(300, "Unauthorized access to playlist")
    }

    // remove video from playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } }, //$pull: removes all instances of passed value in array 
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while adding video on playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video deleted from playlist successfully"));

})

const deletePlaylist = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { playlistId } = req.params
    if (!playlistId.trim()) {
        throw new ApiError(400, "playlist id is required")
    }

    //is user owner of the playlist
    const userOwner = await isUserOwnerofPlaylist(playlistId, userId)
    if (!userOwner) {
        throw new ApiError(300, "Unauthorized access to playlist")
    }

    // delete playlist
    const deleted = await Playlist.findByIdAndDelete(playlistId)
    if (!deleted) {
        throw new ApiError(400, "Error while deleting playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deleted, "playlist deleted successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { playlistId } = req.params
    const { name, description } = req.body

    if ([name, description].some(field => field?.trim() === "" || !field)) {
        throw new ApiError(400, "Playlist name & description are required to be updated")
    }

    //is user owner of the playlist
    const userOwner = await isUserOwnerofPlaylist(playlistId, userId)
    if (!userOwner) {
        throw new ApiError(300, "Unauthorized access to playlist")
    }

    //update playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true }
    );
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while updated playlist info");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist info updated successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}