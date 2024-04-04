import express from "express";
import { User } from "../model/user.js";
import { Post } from "../model/post.js";
import jwt from "jsonwebtoken";



// Register User 
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {

        let user = await User.findOne({ email });

        if (user) return res.status(400).json({
            success: false,
            message: "User already Exits"
        });

        user = await User.create({
            name, email, password,
            profilePicture: "usericon.png",

        });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_URI);

        res.status(200).cookie("token", token, {
            maxAge: 1000 * 60 * 15,
            httpOnly: true,
            sameSite: "none",
            secure: true
        }).json({
            success: true,
            message: "Registerd Successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error
        });

    }
};

// Login User

export const login = async (req, res) => {

    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email }).select("+password");;

        if (!user) return res.status(400).json({
            success: false,
            message: "User is not Exits!!"
        });


        if (password !== user.password) return res.status(400).json({
            success: false,
            message: "Password is not Matched"
        });

        const token = await jwt.sign({ _id: user._id }, process.env.JWT_URI);

        res.status(200).cookie("token", token, {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            sameSite: "none",
            secure: true
        }).json({
            success: true,
            message: "Login"
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
};


// Get User Profile
export const getMyProfile = async (req, res) => {

    try {

        const getPosts = await Post.find({ userId: req.user._id });

        if (getPosts) {
            const profileObj = { ...req.user._doc, getNoOfPosts: getPosts.length };


            res.status(200).json({

                success: true,
                user: profileObj

            });

        }



    } catch (error) {
        res.status(500).json({
            success: true,
            user: error.message
        });
    }

};


// Logout Profile
export const logout = (req, res) => {

    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true
    }).json({
        success: true,
        message: "Logout!!!"
    });
};


export const resetPassword = async (req, res) => {

    try {

        const { newPassword } = req.body;

        const getUser = await User.findById({ _id: req.user._id }).select("+password");


        if (!getUser) return res.status(400).json({
            success: false,
            message: "user not found !!!"
        });



        if (!newPassword === getUser.password) return res.status(400).json({
            success: false,
            message: "Incorrect Current Password !!!"
        });

        await User.findByIdAndUpdate(getUser._id, { password: newPassword });


        res.status(200).json({
            success: true,
            message: "Update"
        });


    } catch (error) {

        res.status(200).json({
            success: false,
            message: "Internal Server Error !!!",
            error: error.messsage
        });

    }

};


// Follow User
export const follow = async (req, res) => {
    const id = req.params.id;
    const { token } = req.cookies;
    const currentUserId = jwt.verify(token, process.env.JWT_URI);

    if (currentUserId === id) {
        res.status(403).json("Action forbidden");
    } else {
        try {
            const followUser = await User.findById(id);
            const followingUser = await User.findById(currentUserId._id);

            if (!followUser.followers.includes(currentUserId._id)) {
                await followUser.updateOne({ $push: { followers: currentUserId._id } });
                await followingUser.updateOne({ $push: { following: id } });
                res.status(200).json({
                    success: true,
                    messsage: "User followed"
                });

            } else {
                await followUser.updateOne({ $pull: { followers: currentUserId._id } });
                await followingUser.updateOne({ $pull: { following: id } });
                res.status(200).json({
                    success: true,
                    messsage: "User Unfollowed"
                });

            }
        } catch (error) {
            res.status(500).json(error);
        }
    }
};


// Folloers List

export const getFollowersList = async (req, res) => {

    // const userId = req.params.id;
    // const getUser = await User.findById(userId);

    // console.log(getUser);


    // const getFollowersList = getUser.followers;
    // const getFollowingList = getUser.following;


    const getFollowersList = req.user.followers;
    const getFollowingList = req.user.following;

    let followersList = [];
    let followingList = [];

    await Promise.all(
        getFollowersList.map(async (i) => {
            // console.log(i);
            const getUser = await User.findById(i);
            if (!getUser) return console.log("User Not FOund");

            const isFollow = await getFollowingList.includes(getUser._id);
            // console.log(isFollow);

            const followerListObject = {
                _id: getUser._id,
                name: getUser.name,
                profilePicture: getUser.profilePicture ? getUser.profilePicture : "usericon.png",
                isFollow: isFollow,
            };

            followersList.push(followerListObject);
        })

    );

    // console.log(followersList);


    await Promise.all(
        getFollowingList.map(async (i) => {
            // console.log(i);
            const getUser = await User.findById(i);
            if (!getUser) return console.log("User Not FOund");

            const followingListObject = {
                _id: getUser._id,
                name: getUser.name,
                profilePicture: getUser.profilePicture ? getUser.profilePicture : "usericon.png",
                isFollow: true,
            };
            // console.log(followingListObject);

            followingList.push(followingListObject);
        })

    );


    res.status(200).json({
        success: true,
        followersList: followersList,
        followingList: followingList
    });

};



// Check isFollowed or IsFollowing User 

export const isfollowed = async (req, res) => {
    const userId = req.params.id;

    const userData = req.user.followers;

    const isFollowed = await userData.includes(userId);

    if (!isFollowed) return res.status(200).json({
        success: true,
        isfollow: false,
    });
    else {
        res.status(200).json({
            success: true,
            isfollow: true,
        });
    }
};


// Update user Profile Information
export const updateUserInfo = async (req, res) => {
    try {

        const { name, status, lives, bio, work } = req.body;
        // console.log(name, status, lives, bio, work);


        const userId = req.user._id.valueOf();


        let profilePhoto;

        if (!req.file) {
            profilePhoto;
        }
        else {
            profilePhoto = req.file.filename;
        }

        // console.log(profilePhoto);


        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, status, lives, bio, work, profilePicture: profilePhoto },
            { new: true }
        );


        const userPostData = await Post.find({ userId });

        userPostData?.map(async (i) => {
            await Post.findByIdAndUpdate(
                i._id
                , {
                    username: name
                },
                {
                    new: true
                });
        });


        res.status(200).json({
            success: true,
            message: "Profile Update"
        });


    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        });
    }

};


// Get All User 

export const getAllUsers = async (req, res) => {
    try {
        const getAllUsers = await User.find();
        const getUserFollowing = req.user.following;

        const allUsersList = [];

        for (const user of getAllUsers) {
            const getUser = await User.findById(user);

            if (!getUser) {
                console.log("User not found !!!");
                continue; // Skip to the next iteration if the user is not found
            }

            const isFollow = getUserFollowing.includes(getUser._id);

            // console.log(isFollow);

            const AllUserObject = {
                _id: getUser._id,
                name: getUser.name,
                profilePicture: getUser.profilePicture ? getUser.profilePicture : "usericon.png",
                isFollow: isFollow,
            };

            allUsersList.push(AllUserObject);
        }

        res.status(200).json({
            success: true,
            allUsers: allUsersList
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        });
    }
};




// Search User Profile
export const getUserProfile = async (req, res) => {

    try {
        const userName = req.params.username;

        // const getUserProfile = await User.findOne({ email: userName });


        // Create a case-insensitive regular expression pattern
        const regexPattern = new RegExp(userName, 'i');

        // Use the regex pattern in the query to find users
        const getUsers = await User.find({ email: { $regex: regexPattern } });


        if (getUsers.length == 0) return res.status(200).json({
            succes: true,
            userData: "User not Found",
            isUser: false
            // userPosts: "User not Found"
        });

        // const getUserPosts = await Post.find({ userId: getUserProfile._id });

        res.status(200).json({
            success: true,
            userData: getUsers,
            isUser: true
            // userPosts: getUserPosts

        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};



// Get Follwoing User Posts 

export const followingPost = async (req, res) => {
    try {


        const getFollowing = req.user.following;
        const userPosts = [];

        for (const userId of getFollowing) {
            const getUserPosts = await Post.find({ userId });

            for (const post of getUserPosts) {

                const userProfilePhoto = await User.findById(post.userId);
                // console.log(userProfilePhoto.profilePicture);
                if (userProfilePhoto) {
                    const postData = {
                        _id: post._id,
                        userId: post.userId,
                        username: post.username,
                        profilePicture: userProfilePhoto.profilePicture,
                        desc: post.desc,
                        img: post.img,
                        likes: post.likes,
                        comments: post.comment,
                        createdAt: post.createdAt,

                    };

                    userPosts.push(postData);
                } else {
                    const postData = {
                        _id: post._id,
                        userId: post.userId,
                        username: post.username,
                        profilePicture: "usericon.png",
                        desc: post.desc,
                        img: post.img,
                        likes: post.likes,
                        comments: post.comment,
                    };

                    userPosts.push(postData);
                }


            }
        }

        res.status(200).json({
            success: true,
            userPosts: userPosts.reverse()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};



// Get User Profile Data

export const getUserProfileData = async (req, res) => {

    const userId = req.params.userid;

    try {

        const userProfile = await User.findById(userId);

        const getNoOfPosts = await Post.find({ userId });

        if (!userProfile) return res.status(200).json({
            success: false,
            message: "User not Found !!!"
        });

        const profileObj = { ...userProfile._doc, getNoOfPosts: getNoOfPosts.length };

        res.status(200).json({
            success: true,
            userProfile: profileObj
        });
    } catch (error) {

        console.log(error.message);

    }

};



// Get Search User Followers and Following 


export const getSearchUserFollowersList = async (req, res) => {

    const userId = req.params.id;
    const getUser = await User.findById(userId);

    // console.log(getUser);


    const getFollowersList = getUser.followers;
    const getFollowingList = getUser.following;


    let followersList = [];
    let followingList = [];

    await Promise.all(
        getFollowersList.map(async (i) => {
            // console.log(i);
            const getUser = await User.findById(i);
            if (!getUser) return console.log("User Not FOund");

            const isFollow = await getFollowingList.includes(getUser._id);
            // console.log(isFollow);

            const followerListObject = {
                _id: getUser._id,
                name: getUser.name,
                profilePicture: getUser.profilePicture ? getUser.profilePicture : "usericon.png",
                isFollow: isFollow,
            };

            followersList.push(followerListObject);
        })

    );

    // console.log(followersList);


    await Promise.all(
        getFollowingList.map(async (i) => {
            // console.log(i);
            const getUser = await User.findById(i);
            if (!getUser) return console.log("User Not FOund");

            const followingListObject = {
                _id: getUser._id,
                name: getUser.name,
                profilePicture: getUser.profilePicture ? getUser.profilePicture : "usericon.png",
                isFollow: true,
            };
            // console.log(followingListObject);

            followingList.push(followingListObject);
        })

    );


    res.status(200).json({
        success: true,
        followersList: followersList,
        followingList: followingList
    });

};
