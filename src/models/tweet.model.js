import mongoose, { Schema } from 'mongoose';

const tweetSchema = new Schema({
    content: {
        type: String,
        required: [true, 'Tweet content is required'],
        trim: true,
        // maxlength: [280, 'Tweet content cannot exceed 280 characters']  // Limit content length 
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Tweet owner is required']
    }
}, { timestamps: true });

export const Tweet = mongoose.model('Tweet', tweetSchema);
