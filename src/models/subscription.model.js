import mongoose, { Schema } from "mongoose";

// Define the subscription schema
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // User who is subscribing
        ref: "User",
        required: [true, "Subscriber is required"],
        validate: {
            validator: (v) => mongoose.Types.ObjectId.isValid(v),
            message: (props) => `${props.value} is not a valid ObjectId!`
        }
    },
    channel: {
        type: Schema.Types.ObjectId, // Channel that is being subscribed to
        ref: "User",
        required: [true, "Channel is required"],
        validate: {
            validator: (v) => mongoose.Types.ObjectId.isValid(v),
            message: (props) => `${props.value} is not a valid ObjectId!`
        }
    }
}, { timestamps: true });

// Add an index to prevent duplicate subscriptions and speed up lookup
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema)