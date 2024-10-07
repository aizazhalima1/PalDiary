const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const diaryController = require("../controllers/diary");
const { ensureAuth } = require("../middleware/auth");

//Post Routes
//Since linked from server js treat each path as:
//post/:id, post/createPost, post/likePost/:id, post/deletePost/:id

router.get("/:id", ensureAuth, diaryController.getDiary)
router.post("/createNewDiary", diaryController.createNewDiary)
//Delete post
router.delete("/:id/edit-post/:postId", diaryController.deletePost)

//Add profile picture
router.post("/:id/createProfilePicture", upload.single("file"), diaryController.createProfilePicture);
//Assign a pal
router.post("/:id/findPal", diaryController.findPal);

//Enables user to create post 
router.post("/:id", diaryController.createPost);

module.exports = router;