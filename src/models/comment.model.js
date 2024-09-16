import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true, // Trims any leading or trailing whitespace
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: [true, 'Video reference is required'], // Ensure a video reference is provided
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, 'Owner reference is required'], // Ensure an owner reference is provided
        },
    },
    {
        timestamps: true,
        // toJSON: {
        //     virtuals: true, // Include virtuals in JSON output
        //     versionKey: false, // Exclude the version key from JSON output
        // },
        // toObject: {
        //     virtuals: true, // Include virtuals in plain objects
        // },
    }
);

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)