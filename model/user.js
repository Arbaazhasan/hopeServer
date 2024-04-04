import mongoose from "mongoose";


const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    bio: {
        type: String,
    },
    status: {
        type: String
    },
    lives: {
        type: String
    },
    work: {
        type: String
    },
    profilePicture: {
        type: String
    },
    coverPhoto: {
        type: String
    },
    followers: {
        type: Array,
        default: []
    },
    following: {
        type: Array,
        default: []
    },
    likedPosts: {
        type: Array,
        default: []
    },
    savedPosts: {
        type: Array,
        default: []
    },
    createat: {
        type: Date,
        default: Date.now
    }
});

export const User = mongoose.model("user", appSchema);
