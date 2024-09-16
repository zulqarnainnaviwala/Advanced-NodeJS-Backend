import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Playlist name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Playlist description is required'],
        trim: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Playlist owner is required']
    }
}, { timestamps: true });

export const Playlist = mongoose.model('Playlist', playlistSchema);