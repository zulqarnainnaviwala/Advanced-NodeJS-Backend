import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
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
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'The user who liked the content must be specified.']
  }
}, {
  timestamps: true,
});

// Add index to improve query performance and ensure unique likes per user and content type
likeSchema.index({ video: 1, comment: 1, tweet: 1, likedBy: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema)

//Another Version of Schema
// import mongoose, { Schema } from "mongoose";

// const likeSchema = new Schema({
//   // Type of content being liked (video, comment, tweet)
//   type: {
//     type: String,
//     enum: ['video', 'comment', 'tweet'], // Limit to specific types
//     required: true
//   },
//   contentId: {
//     type: Schema.Types.ObjectId,
//     required: true,
//     // To ensure referential integrity
//     refPath: 'type'
//   },
//   likedBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   }
// }, {
//   timestamps: true, // Automatically manage createdAt and updatedAt fields
// });

// // Add index for better performance on frequent queries
// likeSchema.index({ type: 1, contentId: 1, likedBy: 1 }, { unique: true });

// export const Like = mongoose.model("Like", likeSchema);
