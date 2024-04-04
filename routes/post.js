import express from "express";
import { comment, create, deletePost, getComments, getAllLikedPost, getAllSavedPosts, getAllUsersPosts, getMyPost, isLiked, likePost, savedPosts, updatePost, upload, isSaved, getSearchUserPost } from "../controller/post.js";
import { isAuthonticated } from "../middleware/auth.js";

const router = express.Router();


router.post("/create", upload.single("image"), create);
router.put("/:id", isAuthonticated, updatePost);
router.delete("/:id", isAuthonticated, deletePost);
router.get("/getmyposts", isAuthonticated, getMyPost);
router.put("/:id/like", isAuthonticated, likePost);
router.get("/isliked/:id", isAuthonticated, isLiked);
router.get("/getlikedposts", isAuthonticated, getAllLikedPost);
router.put("/savepost/:id", isAuthonticated, savedPosts);
router.get("/getsavedposts", isAuthonticated, getAllSavedPosts);
router.get("/issaved/:id", isAuthonticated, isSaved);
router.get("/getallusersposts", isAuthonticated, getAllUsersPosts);
router.put("/comment/:id", isAuthonticated, comment);
router.get("/getcomments/:id", isAuthonticated, getComments);
router.get("/getsearchuserpost/:id", isAuthonticated, getSearchUserPost);



export default router;