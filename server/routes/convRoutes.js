const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addConversation,
  getConversationUser,
  deleteConversation,
} = require("../controllers/conversationControllers");

router
  .route("/")
  .get(protect, getConversationUser)
  .post(protect, addConversation);

router.route("/:conversationId").delete(protect, deleteConversation);

module.exports = router;
