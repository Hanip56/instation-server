const router = require("express").Router();
const {
  sendMessage,
  getMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, sendMessage);

router.route("/:conversationId").get(protect, getMessage);

module.exports = router;
