import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to toggle like (generalized for video, comment, tweet)
const toggleLike = async (contentType, contentId, userId, session) => {
  let like, dislike;
  // 2. Check if the user has already disliked the content and delete the dislike if it exists
  const existingDislike = await Dislike.findOne({
    [contentType]: contentId,
    dislikedBy: userId,
  }).session(session);

  if (existingDislike) {
    // Delete the dislike
    await Dislike.findOneAndDelete({
      [contentType]: contentId,
      dislikedBy: userId,
    }).session(session);  // Delete the dislike

    dislike = false;
  }

  // 3. Check if the user has already liked the content and delete the like if it exists
  const existingLike = await Like.findOne({
    [contentType]: contentId,
    likedBy: userId,
  }).session(session);

  if (existingLike) {
    // If the like exists, remove it
    await Like.findOneAndDelete({
      [contentType]: contentId,
      likedBy: userId,
    }).session(session);
    like = false;
    return { like, dislike };  // Like was removed
  }

  // 4. If no existing like, create a new like
  const newLike = new Like({
    [contentType]: contentId,
    likedBy: userId,
  });

  await newLike.save({ session });  // Save the new like within the session
  like = true;

  return { like, dislike };  // Like was added
};

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "user id is required")
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid user id")
  }
  if (!videoId || !videoId.trim()) {
    throw new ApiError(400, "video id is required")
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id")
  }

  const video = await Video.findOne({ _id: videoId, $or: [{ owner: req.user._id }, { isPublished: true }] });
  if (!video) {
    throw new ApiError(404, "Video not found or not available right now")
  }

  // Start a session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { like, dislike = false } = await toggleLike("video", videoId, userId, session);

    await session.commitTransaction();  // Commit the transaction after the like toggle

    return res.status(200).json(
      new ApiResponse(200, { like, dislike }, like ? "Video liked." : "Video unliked.")
    );
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new ApiError(error.statusCode ? error.statusCode : 500, error.message ? error.message : "Something went wrong while toggling video like.");
  } finally {
    // End the session whether it's committed or aborted
    session.endSession();
  }
});

// Toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "user id is required")
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid user id")
  }
  if (!commentId || !commentId.trim()) {
    throw new ApiError(400, "comment id is required")
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid comment id")
  }

  // 1. Validate content existence (can be handled outside)
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(404, `Comment not found.`);
  }

  // Start a session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    const { like, dislike = false } = await toggleLike("comment", commentId, userId, session);

    await session.commitTransaction();  // Commit the transaction after the like toggle

    return res.status(200).json(
      new ApiResponse(200, { like, dislike }, like ? "comment liked." : "comment unliked.")
    );
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new ApiError(error.statusCode ? error.statusCode : 500, error.message ? error.message : "Something went wrong while toggling comment like.");
  } finally {
    // End the session whether it's committed or aborted
    session.endSession();
  }
});

// Toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "user id is required")
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid user id")
  }
  if (!tweetId || !tweetId.trim()) {
    throw new ApiError(400, "tweet id is required")
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet id")
  }

  // 1. Validate content existence (can be handled outside)
  const tweet = await Tweet.findById(tweetId)
  if (!tweet) {
    throw new ApiError(404, `tweet not found.`);
  }
  // Start a session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    const { like, dislike = false } = await toggleLike("tweet", tweetId, userId, session);

    await session.commitTransaction();  // Commit the transaction after the like toggle

    return res.status(200).json(
      new ApiResponse(200, { like, dislike }, like ? "tweet liked." : "tweet unliked.")
    );
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    throw new ApiError(error.statusCode ? error.statusCode : 500, error.message ? error.message : "Something went wrong while toggling tweet like.");
  } finally {
    // End the session whether it's committed or aborted
    session.endSession();
  }
});

// Get all liked videos by the current user
const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      throw new ApiError(400, "user id is required")
    }
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "invalid user id")
    }

    const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } })
      .populate({
        path: "video",  // Populate the 'video' field
        select: "thumbnail title duration views createdAt",  // Select fields for video
        populate: {
          path: "owner",  // Nested populate for the 'owner' field within 'video'
          select: "-_id username fullName avatar",  // Exclude _id by default and select specific fields
        },
      })
      .exec();

    // Check if no liked videos are found
    if (likedVideos.length === 0) {
      return res.status(200).json(new ApiResponse(200, likedVideos, "No liked videos found."));
    }

    // Respond with the liked videos data
    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully."));
  } catch (error) {
    // Handle any errors during the process
    return res.status(500).json(new ApiResponse(500, null, "An error occurred while retrieving liked videos."));
  }
});


// getLikedVideos With Aggregation Pipeline
// const getLikedVideos = asyncHandler(async (req, res) => {
//   let userId = req.user._id

//   if (!userId) {
//     throw new ApiError(400, "user id is required")
//   }
//   if (!isValidObjectId(userId)) {
//     throw new ApiError(400, "invalid user id")
//   }

//   try {
//     const likedVideos = await Like.aggregate([
//       // Match documents where likedBy is the userId and video is not null
//       {
//         $match: {
//           likedBy: userId,
//           video: { $ne: null }
//         }
//       },
//       // Lookup to join the 'video' collection
//       {
//         $lookup: {
//           from: 'videos',
//           localField: 'video',
//           foreignField: '_id',
//           as: 'video',
//           pipeline: [
//             {
//               $project: {
//                 _id: 0,
//                 thumbnail: 1,
//                 title: 1,
//                 duration: 1,
//                 views: 1,
//                 createdAt: 1,
//                 owner: 1,
//               }
//             },
//             {
//               $lookup: {
//                 from: 'users',
//                 localField: 'owner',
//                 foreignField: '_id',
//                 as: 'owner',
//                 pipeline: [
//                   {
//                     $project: {
//                       _id: 0,
//                       username: 1,
//                       fullName: 1,
//                       avatar: 1,
//                     }
//                   }
//                 ]
//               }
//             },
//             {
//               $unwind: {
//                 path: '$owner',  // Ensure 'owner' is a single object
//                 preserveNullAndEmptyArrays: true // In case the owner field is missing
//               }
//             }
//           ]
//         }
//       },
//       // Unwind the 'video' field so it can be accessed directly
//       {
//         $unwind: {
//           path: '$video',
//           preserveNullAndEmptyArrays: false  // Only include records where 'video' exists
//         }
//       },

//     ]);

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(200, likedVideos, "liked videos fetched successfully")
//       )
//   } catch (error) {
//     throw new ApiError(500, error?.message || "Something went wrong while fetching videos");
//   }
// })

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };