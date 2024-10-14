import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

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

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {

})

const updatePlaylist = asyncHandler(async (req, res) => {

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