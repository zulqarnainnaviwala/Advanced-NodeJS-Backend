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
    const subscriberId = req.params.subscriberId?.trim();
    if (!subscriberId) {
        throw new ApiError(400, "subscriber id is required")
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "invalid subscriber id")
    }

    try {
        const channelSubscribers = await Subscription.aggregate(
            [
                {
                    $match: {
                        channel: new mongoose.Types.ObjectId(subscriberId)
                    },
                },
                {
                    $group: {
                        _id: "$channel",
                        subscribers: { $push: "$subscriber" },
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "subscribers",
                        foreignField: "_id",
                        as: "subscribers",
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
                                    subscribersCount: {
                                        $size: "$subscribers"
                                    },

                                    isSubscribed: {
                                        $cond: {
                                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                            then: true,
                                            else: false
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    username: 1,
                                    fullName: 1,
                                    avatar: 1,
                                    subscribersCount: 1,
                                    isSubscribed: 1,
                                }
                            },
                        ]
                    },
                },
                {
                    $project: {
                        _id: 0,
                        subscribers: 1
                    }
                },
            ]);

        if (!channelSubscribers || channelSubscribers.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "Channel has no subscribers")
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, channelSubscribers[0].subscribers, "Channel subscribers list fetched successfully")
            );
    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while fetching channel subscribers");
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    const channelId = req.params.channelId?.trim();
    if (!channelId) {
        throw new ApiError(400, "channel id is required")
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel id")
    }

    try {
        const subscribersList = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(channelId)
                },
            },
            {
                $group: {
                    _id: "$subscriber",
                    channels: { $push: "$channel" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channels",
                    foreignField: "_id",
                    as: "channels",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers",
                            },
                        },
                        {
                            $addFields: {
                                subscribersCount: {
                                    $size: "$subscribers",
                                },

                                isSubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [
                                                req.user?._id,
                                                "$subscribers.subscriber",
                                            ],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1,
                            },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 0,
                    channels: 1,
                },
            },
        ]);

        if (!subscribersList || subscribersList.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "Channel has no subscribers")
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, subscribersList[0].channels, "Subscribed channels list fetched successfully")
            );

    } catch (error) {
        throw new ApiError(500, error?.message || "An error occurred while fetching subscribed channels");
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}