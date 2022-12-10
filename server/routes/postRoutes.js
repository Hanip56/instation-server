const router = require("express").Router();
const {
  uploadPost,
  getAllPosts,
  getPostFollowing,
  likeAndUnlike,
  deletePost,
  updateCaption,
  addComment,
  saveAndUnsave,
  getPostDetail,
} = require("../controllers/postControllers");
const { protect } = require("../middleware/authMiddleware");

// add post
router.route("/add").post(protect, uploadPost);

// get all post
router.route("/all").get(getAllPosts);

// get post of following
router.route("/postsfollowing").get(protect, getPostFollowing);

// like and unlike post
router.route("/:postId/likeandunlike").put(protect, likeAndUnlike);

// save and unsave post
router.route("/:postId/saveandunsave").put(protect, saveAndUnsave);

// add comment
router.route("/:postId/addcomment").put(protect, addComment);

// delete,update post
router
  .route("/:postId")
  .get(getPostDetail)
  .delete(protect, deletePost)
  .put(protect, updateCaption);

module.exports = router;
