import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
})

const getUserPlaylists = asyncHandler(async (req, res) => {
})

const getPlaylistById = asyncHandler(async (req, res) => {
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