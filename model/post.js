import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true // Corrected typo
        },
        username: {
            type: String
        },
        desc: {
            type: String,
        },
        img: {
            type: String,
        },
        likes: {
            type: Array,
            default: [],
        },
        comment: {
            type: Array,
            default: []
        },
        createdAt: {
            type: Date,
            default: Date.now // Automatically set to the current date and time when a document is created
        }
    }
);

export const Post = mongoose.model("Post", PostSchema);
