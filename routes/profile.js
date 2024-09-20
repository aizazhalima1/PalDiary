const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const profileController = require("../controllers/profile");
const { ensureAuth } = require("../middleware/auth");

router.get("/", ensureAuth, profileController.getProfile)
router.get("/pal-requests/:userId", ensureAuth, profileController.getPalNotification)
router.post("/pal-requests/:requestId/accept-request",profileController.acceptRequest);
router.post("/pal-requests/:requestId/reject-request",profileController.rejectRequest);
module.exports = router;
