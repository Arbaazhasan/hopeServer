import {
    Post
} from "../model/post.js";
import jwt from "jsonwebtoken";
import {
    isAuthonticated
} from "../middleware/auth.js";
import {
    User
} from "../model/user.js";
import multer from "multer";
import express from "express";
import path from "path";
import fs from 'fs';


// Create post


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,
            "public/image");
    },
    filename: function (req, file, cb) {
        // cb(null, `${Date.now() + file.originalname}`);

        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
});



export const upload = multer({
    storage
});




export const create = async (req, res) => {

    const { desc
    } = req.body;
    const { token
    } = req.cookies;
    const userId = jwt.verify(token, process.env.JWT_URI);
    const userData = await User.findById(userId);
    // console.log(userData.name);


    let postFileName = '';

    if (!req.file) {
        postFileName = '';
    }
    else {
        postFileName = req.file.filename;
    }
    // const profilePhoto = req.file.filename;


    const createPost = await Post.create({
        userId,
        username: userData.name,
        img: postFileName,
        desc,
    });

    res.status(200).json({
        success: true,
        message: "Post Created"
    });
};

// Update post
export const updatePost = async (req, res) => {

    const { token
    } = req.cookies;
    const userId = jwt.verify(token, process.env.JWT_URI);

    const postId = req.params.id;
    const { desc, img
    } = req.body;

    const post = await Post.findById(postId);
    // console.log(post);

    if (!post.userId === userId._id) return res.status(403).json({
        success: false,
        message: "Action forbidden"
    });

    await post.updateOne({
        desc,
        img
    });

    res.status(200).json({
        success: true,
        message: "Post Updated"
    });
};


// Delete Post
export const deletePost = async (req, res) => {
    const { token
    } = req.cookies;
    const userId = jwt.verify(token, process.env.JWT_URI);

    const postId = req.params.id;

    const post = await Post.findById(postId);


    if (!post) return res.status(400).json({
        success: false,
        messaage: "Post Now Found"
    });

    if (!post.userId === userId._id) return res.status(403).json({
        success: false,
        message: "Action Forbidden !!!"
    });


    // Delete the file from the public directory
    const filePath = `public/image/${post.img
        }`;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    // Delete the post from the database
    await post.deleteOne({
        userId: postId
    });

    res.status(200).json({
        success: true,
        message: "Post Deleted "
    });
};


// Like Post

export const likePost = async (req, res) => {

    const { token
    } = req.cookies;
    // console.log(token)
    const userId = jwt.verify(token, process.env.JWT_URI);
    const id = req.params.id;

    const user = await User.findById(userId);
    const post = await Post.findById(id);

    // console.log(user, post);

    if (!post.likes.includes(userId._id)) {
        await post.updateOne({
            $push: {
                likes: userId._id
            }
        });
        await user.updateOne({
            $push: {
                likedPosts: post._id
            }
        });
        await

            res.status(200).json({
                success: true,
                messaage: "Post Liked !"
            });
    } else {
        await post.updateOne({
            $pull: {
                likes: userId._id
            }
        });
        await user.updateOne({
            $pull: {
                likedPosts: post._id
            }
        });

        res.status(200).json({
            success: true,
            messaage: "Post Unliked"
        });
    }
};


// Check Post is Liked or not 

export const isLiked = async (req, res) => {

    const postId = req.params.id;

    try {
        const userLikedPostArray = req.user.likedPosts;

        const isLikedPost = await userLikedPostArray.includes(postId);
        if (isLikedPost) return res.status(200).json({
            success: true,
            isliked: true
        });
        else return res.status(200).json({
            success: true,
            isliked: false
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            messaage: error
        });
    }
};
// Adding Comment 

export const comment = async (req, res) => {
    const postId = req.params.id;
    const { _id, name, profilePicture
    } = req.user;
    const { userComment
    } = req.body;

    try {
        const saveComment = {
            commentUser_id: _id,
            commentUsername: name,
            commentUserPriofilePicture: profilePicture,
            comment: userComment
        };

        const addComment = await Post.findByIdAndUpdate(postId,
            {
                $push: {
                    comment: saveComment
                }
            },
            {
                new: true
            });

        if (addComment) return res.status(200).json({
            success: true,
            message: "Comment Add"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};




// Get User Post COmment

export const getComments = async (req, res) => {

    const postId = req.params.id;

    // console.log(postId)

    const post = await Post.findById(postId);


    if (!post || !post.comment || post.comment.length === 0) return res.status(200).json({
        success: true,
        comments: false,
    });


    res.status(200).json({
        success: true,
        comments: post.comment
    });
};
// Get All Liked Posts

export const getAllLikedPost = async (req, res) => {
    try {

        const likedPostsId = req.user.likedPosts;
        let likedPostsData = [];

        await Promise.all(
            likedPostsId.map(async (i) => {
                const getPost = await Post.findById(i);
                if (getPost) {

                    const getUser = await User.findById({ _id: getPost.userId });

                    if (getUser) {
                        const newObj = { ...getPost._doc, profilePicture: getUser.profilePicture };
                        likedPostsData.push(newObj);
                    }

                }
            })
        );


        res.status(200).json({
            success: true,
            likedPosts: likedPostsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get ALl Posts 

export const getMyPost = async (req, res) => {
    const { token
    } = req.cookies;

    const userId = jwt.verify(token, process.env.JWT_URI);

    const posts = await Post.find({
        userId
    });
    // console.log(posts)

    res.status(200).json({
        success: true,
        posts: posts.reverse()
    });
};


// saved Post
export const savedPosts = async (req, res) => {

    try {
        const { token
        } = req.cookies;
        const userId = jwt.verify(token, process.env.JWT_URI);
        const postId = req.params.id;

        const postData = await Post.findById(postId);

        if (!postData) return res.json(400).json({
            success: false,
            message: "Post not Found"
        });

        // const user = await User.findById(userId);
        const isPostSaved = await req.user.savedPosts.includes(postData._id);

        if (!isPostSaved) {
            const savedPost = await User.updateOne({
                _id: userId
            },
                {
                    $push: {
                        savedPosts: postData._id
                    }
                });

            if (savedPost) return res.status(200).json({
                success: true,
                message: "Post Saved"
            });
        } else {
            const savedPost = await User.updateOne({
                _id: userId
            },
                {
                    $pull: {
                        savedPosts: postData._id
                    }
                });
            if (savedPost) return res.status(200).json({
                success: true,
                message: "Post Unsaved"
            });
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        });
    }
};



export const getAllSavedPosts = async (req, res) => {
    try {

        const savedPostsId = req.user.savedPosts;
        let savedPostData = [];

        await Promise.all(
            savedPostsId.map(async (postId) => {
                const getPost = await Post.findById(postId);

                if (getPost) {
                    const getUser = await User.findById(getPost.userId);

                    if (getUser) {
                        const newObj = { ...getPost._doc, profilePicture: getUser.profilePicture };
                        savedPostData.push(newObj);
                    }
                }
            })
        );

        res.status(200).json({
            success: true,
            savedPosts: savedPostData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// Check is Post Saved or not

export const isSaved = async (req, res) => {

    const postId = req.params.id;

    try {
        const usersavedPostsArray = req.user.savedPosts;

        const isSavedPost = await usersavedPostsArray.includes(postId);
        if (isSavedPost) return res.status(200).json({
            success: true,
            issaved: true
        });
        else return res.status(200).json({
            success: true,
            issaved: false
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            messaage: error
        });
    }
};



// Get aLL User Uploads Posts
export const getAllUsersPosts = async (req, res) => {

    try {
        const allPosts = await Post.find();

        const allPostsData = [];

        for (const i of allPosts) {

            const getUser = await User.findById(i.userId);

            if (!getUser) {
                continue;
            }

            const postData = {
                _id: i._id,
                username: i.username,
                userId: i.userId,
                desc: i.desc,
                img: i.img,
                likes: i.likes,
                profilePicture: getUser.profilePicture,
                createdAt: i.createdAt
            };

            allPostsData.push(postData);
        }


        if (allPosts) {
            res.status(200).json({
                success: true,
                allposts: allPostsData.reverse()
            });
        }

    } catch (error) {

        res.status(400).json({
            success: false,
            messaage: error
        });
    }
};



// Get Searched User Post

export const getSearchUserPost = async (req, res) => {

    const userId = req.params.id;
    try {

        const posts = await Post.find({
            userId
        });
        // console.log(posts)

        res.status(200).json({
            success: true,
            posts: posts.reverse()
        });
    } catch (error) {

        console.log(error);
    }
};



// export const getMyPost = async (req, res) => {
//     try {
//       const { token } = req.cookies;
//       const userId = jwt.verify(token, process.env.JWT_URI);
//       const posts = await Post.find({ userId });
//       // Extract image filenames from the posts
//       const postWithImages = posts.map((post) => {
//         return {
//           _id: post._id,
//           username: post.username,
//           desc: post.desc,
//           image: post.image, // Assuming you have an 'image' field in your Post model
//         };
//       });
//       res.status(200).json({
//         success: true,
//         posts: postWithImages.reverse(),
//       });
//     } catch (error) {
//       console.error('Error fetching user posts:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch user posts",
//       });
//     }
//   };