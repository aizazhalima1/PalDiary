const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const diaryController = require("../controllers/diary");
const { ensureAuth } = require("../middleware/auth");

//Post Routes
//Since linked from server js treat each path as:
//post/:id, post/createPost, post/likePost/:id, post/deletePost/:id
//router.get("/", ensureAuth, diaryController.getDiary);
router.get("/:id", ensureAuth, diaryController.getDiary)
//Add profile picture
router.post("/createProfilePicture", upload.single("file"), diaryController.createProfilePicture);
//Assign a pal
router.post("/findPal", diaryController.findPal);

//Enables user to create post 
router.post("/:id", diaryController.createPost);

//Enables user to like post. In controller, uses POST model to update likes by 1
//router.put("/likePost/:id", postsController.likePost);

//Enables user to delete post. In controller, uses POST model to delete post from MongoDB collection
//router.delete("/deletePost/:id", postsController.deletePost);

module.exports = router;