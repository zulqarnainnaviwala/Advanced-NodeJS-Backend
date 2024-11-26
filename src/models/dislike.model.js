import mongoose, { Schema } from "mongoose";

const dislikeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    dislikedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'The user who disliked the content must be specified.']
    }
}, {
    timestamps: true,
});

// Add index to improve query performance and ensure unique likes per user and content type
dislikeSchema.index({ video: 1, comment: 1, tweet: 1, dislikedBy: 1 }, { unique: true });

export const Dislike = mongoose.model("Dislike", dislikeSchema)