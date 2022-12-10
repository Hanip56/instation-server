const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const multer = require("multer");
const uploadImg = require("../utils/uploadImg");
const fs = require("fs");
const catchAsync = require("../middleware/catchAsync");
const ErrorHandler = require("../utils/errorHandler");
const fsPromises = require("fs").promises;

// @desc    upload post
// @route   POST /post/add
// @access  PRIVATE
const uploadPost = asyncHandler(async (req, res, next) => {
  uploadImg(req, res, async function (err) {
    if (err instanceof multer.MulterError || err) {
      res.status(400);
      return next(new ErrorHandler(err.message, 400));
    }

    if (req.file === undefined) {
      res.status(400);
      return next(new ErrorHandler("Error no file selected", 400));
      // An unknown error occurred when uploading.
    }

    try {
      const user = await User.findById(req.user._id);
      const newPost = await Post.create({
        postedBy: user._id,
        caption: req.body.caption,
        image: req.file.filename,
      });
      await user.updateOne({ $push: { posts: newPost._id } });

      res.status(201).json(newPost);
    } catch (error) {
      fs.unlinkSync(req?.file?.path);
      res.status(500);
      return next(new ErrorHandler(error.message, 500));
    }
  });
});

// @desc    get all posts
// @route   GET /post/getAll
// @access  PUBLIC
const getAllPosts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 15;

  const currentPage = Number(req.query.page) || 1;

  const skipPost = limit * (currentPage - 1);

  const totalPosts = await Post.find().countDocuments();

  const maxPages = Math.ceil(totalPosts / limit);

  const posts = await Post.find()
    .populate("postedBy likes savedBy", "_id username profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "_id username profilePicture",
      },
    })
    .limit(limit)
    .skip(skipPost)
    .sort({ createdAt: -1 });

  res.status(200).json({ posts, maxPages });
});

// @desct   get post Detail
// @route   GET /post/:postId
// @access  PUBLIC
const getPostDetail = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId)
    .populate("postedBy likes", "_id username profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "_id username profilePicture",
      },
    });

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.status(200).json(post);
});

// @desc    get post of following
// @route   GET /post/getpostfollowing
// @access  PRIVATE
const getPostFollowing = asyncHandler(async (req, res) => {
  const user = req.user;

  const limit = Number(req.query.limit) || 4;

  const currentPage = Number(req.query.page) || 1;

  const skipPost = limit * (currentPage - 1);

  const totalPosts = await Post.find({
    postedBy: { $in: user.followings },
  }).countDocuments();

  const maxPages = Math.ceil(totalPosts / limit);

  const postFollowing = await Post.find({
    postedBy: { $in: user.followings },
  })
    .populate("postedBy likes savedBy", "_id username profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "_id username profilePicture",
      },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skipPost);

  res.status(200).json({ posts: postFollowing, totalPosts, maxPages });
});

// @desc    like and unlike post
// @route   PUT /post/:postId/likeandunlike
// @access  PRIVATE
const likeAndUnlike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (!post.likes.includes(req.user._id)) {
    await post.updateOne({ $push: { likes: req.user._id } });

    res.status(200).json({
      id: req.params.postId,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      message: "The post has been liked",
    });
  } else {
    await post.updateOne({ $pull: { likes: req.user._id } });

    res.status(200).json({
      id: req.params.postId,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      message: "The post has been unliked",
    });
  }
});

// @desc    delete post
// @route   DELETE /post/:postId
// @access  PRIVATE
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (req.user._id.toString() !== post.postedBy.toString()) {
    res.status(403);
    throw new Error("Action Forbidden");
  }

  await fsPromises.unlink("./server/public/" + post.image);

  await post.remove();

  const user = await User.findById(req.user._id);

  const index = user.posts.indexOf(req.params.postId);
  user.posts.splice(index, 1);

  res.status(200).json(post._id);
});

// @desc    update caption post
// @route   UPDATE /post/:postId
// @access  PRIVATE
const updateCaption = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    res.status(404);
    throw new Error({ message: "Post not found" });
  }

  if (req.user._id.toString() !== post.postedBy.toString()) {
    res.status(403);
    throw new Error("Action Forbidden");
  }

  post.caption = req.body.caption || post.caption;

  await post.save();

  res.status(200).json({ id: post._id, caption: post.caption });
});

// @desc    add comment post
// @route   UPDATE /post/:postId/addcomment
// @access  PRIVATE
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (!req.body.comment) {
    res.status(400);
    throw new Error("Comment cant be empty");
  }

  try {
    await post.updateOne({
      $push: { comments: { user: req.user._id, comment: req.body.comment } },
    });

    const data = {
      id: req.params.postId,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      comment: req.body.comment,
    };

    res.status(200).json({ data, message: "Comment added" });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    save and unsave post
// @route   UPDATE /post/:postId/saveandunsave
// @access  PRIVATE
const saveAndUnsave = asyncHandler(async (req, res) => {
  const user = req.user;
  const post = await Post.findById(req.params.postId);

  if (!post.savedBy.includes(req.user._id)) {
    await post.updateOne({ $push: { savedBy: req.user._id } });

    await user.updateOne({ $push: { saved: post._id } });

    res.status(200).json({
      id: req.params.postId,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      message: "The post has been saved",
    });
  } else {
    await post.updateOne({ $pull: { savedBy: req.user._id } });

    await user.updateOne({ $pull: { saved: post._id } });

    res.status(200).json({
      id: req.params.postId,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture,
      },
      message: "The post has been Unsaved",
    });
  }
});

module.exports = {
  uploadPost,
  getAllPosts,
  getPostFollowing,
  likeAndUnlike,
  deletePost,
  updateCaption,
  addComment,
  saveAndUnsave,
  getPostDetail,
};
