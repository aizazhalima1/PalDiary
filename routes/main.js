const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const { ensureAuth } = require("../middleware/auth");
const auth = require("../middleware/auth");

//Main Routes 
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);

//Routes for user login/signup
router.get("/feed", ensureAuth, homeController.getFeed)
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/request-reset", authController.getRequest);
router.post("/request-reset", authController.requestReset);
router.get("/reset/:token", authController.getResetRequest)
router.post("/reset/:token", authController.postResetRequest)


module.exports = router;