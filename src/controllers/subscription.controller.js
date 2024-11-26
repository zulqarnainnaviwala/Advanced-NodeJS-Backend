import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId?.trim();
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    try {
        // Check if the subscription exists. If it does, delete it. Otherwise, create a new one.
        const subscription = await Subscription.findOneAndUpdate(
            { subscriber: userId, channel: channelId },
            {},
            {
                new: true,
                upsert: true,  // This will create a subscription if none exists
                setDefaultsOnInsert: true
            }
        );

        if (!subscription) {
            throw new ApiError(500, "Something went wrong while toggling subscription");
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200, subscription, subscription ? "Successfully Subscribed" : "Successfully Unsubscribed")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while toggling subscription");
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}