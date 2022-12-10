const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const uploadImg = require("../utils/uploadImg");
const multer = require("multer");

// @desc    get personal account info
// @route   GET /api/user/:userId
// @access  PUBLIC
const getPersonalAccount = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "followings followers",
        select: "_id username profilePicture fullname",
      })
      .populate({
        path: "saved posts",
      })
      .populate({
        path: "saved posts",
        populate: {
          path: "postedBy likes savedBy",
          select: "_id username profilePicture",
        },
      })
      .populate({
        path: "saved posts",
        populate: {
          path: "comments",
          populate: {
            path: "user",
            select: "_id username profilePicture",
          },
        },
      });

    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    get one user
// @route   GET /api/user/:username
// @access  PUBLIC
const getOneUser = asyncHandler(async (req, res) => {
  const username = req.params.username;

  const user = await User.findOne({ username })
    .populate({
      path: "followings followers",
      select: "_id username profilePicture fullname",
    })
    .populate({
      path: "saved posts",
    })
    .populate({
      path: "saved posts",
      populate: {
        path: "postedBy likes savedBy",
        select: "_id username profilePicture",
      },
    })
    .populate({
      path: "saved posts",
      populate: {
        path: "comments",
        populate: {
          path: "user",
          select: "_id username profilePicture",
        },
      },
    });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});

// @desc    get all user
// @route   GET /api/user/:userId
// @access  PUBLIC
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json(users);
});

// @desc    find user
// @route   GET /api/user/find
// @access  PUBLIC
const findUser = asyncHandler(async (req, res) => {
  const search = req.query.search;

  try {
    const users = await User.find({
      username: { $regex: ".*" + search + ".*" },
    }).select("_id username fullname profilePicture");

    res.status(200).json(users);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    update one user
// @route   PUT /api/user/:userId
// @access  PRIVATE
const updateUser = asyncHandler(async (req, res) => {
  if (req.params.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You just can update your account");
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });

    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    delete one user
// @route   DELETE /api/user/:userId
// @access  PRIVATE
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You just can delete your account");
  }

  const deletedUser = await User.findByIdAndDelete(req.params.userId);

  res.status(200).json(deletedUser._id);
});

// @desc    follow one user
// @route   PUT /api/user/:userId/follow
// @access  PRIVATE
const followUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { _id } = req.user;

  if (userId === _id.toString()) {
    res.status(403);
    throw new Error("Action Forbidden");
  }

  const currentUser = await User.findById(_id);
  const targetUser = await User.findById(userId);

  if (!currentUser.followings.includes(userId)) {
    await targetUser.updateOne({ $push: { followers: _id } });
    await currentUser.updateOne({ $push: { followings: userId } });

    res.status(200).json({
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture,
      },
      message: "User Followed",
    });
  } else {
    res.status(400).json("You already followed this account");
  }
});

// @desc    unfollow one user
// @route   PUT /api/user/:userId/unfollow
// @access  PRIVATE
const unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { _id } = req.user;

  if (!userId) {
    res.status(404);
    throw new Error("User not found");
  }

  if (userId === _id.toString()) {
    res.status(403);
    throw new Error("Action Forbidden");
  }

  const currentUser = await User.findById(_id);
  const targetUser = await User.findById(userId);

  if (currentUser.followings.includes(userId)) {
    await targetUser.updateOne({ $pull: { followers: _id } });
    await currentUser.updateOne({ $pull: { followings: userId } });

    res.status(200).json({
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture,
      },
      message: "Unfollowed Succesfully",
    });
  } else {
    res.status(400).json("You already unfollowed this account");
  }
});

// @desc    remove follower
// @route   PUT /api/user/:userId/removefollower
// @access  PRIVATE
const removeFollower = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { _id } = req.user;

  if (!userId) {
    res.status(404);
    throw new Error("User not found");
  }

  if (userId === _id.toString()) {
    res.status(403);
    throw new Error("Action Forbidden");
  }

  try {
    const currentUser = await User.findById(_id);
    const targetUser = await User.findById(userId);

    if (currentUser.followers.includes(userId)) {
      await targetUser.updateOne({ $pull: { followings: _id } });
      await currentUser.updateOne({ $pull: { followers: userId } });

      res.status(200).json({
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          profilePicture: targetUser.profilePicture,
        },
        message: "removed Succesfully",
      });
    } else {
      res.status(400).json("You already removed this follower");
    }
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    update profile picture
// @route   PUT /:userId/profilepicture
// @access  PRIVATE
const updateProfilePicture = asyncHandler(async (req, res) => {
  uploadImg(req, res, async function (err) {
    if (err instanceof multer.MulterError || err) {
      res.status(500);
      throw new Error(err.message);
    }

    if (req.file === undefined) {
      res.status(400);
      throw new Error("Error no file selected");
      // An unknown error occurred when uploading.
    }

    try {
      const user = await User.findById(req.user._id);
      await user.updateOne({ profilePicture: req.file.filename });
      const updatedUser = await user.save();

      res.status(201).json(req.file.filename);
    } catch (error) {
      fs.unlinkSync(req.file.path);
      res.status(500);
      throw new Error(error.message);
    }
  });
});

module.exports = {
  getPersonalAccount,
  findUser,
  getOneUser,
  getAllUsers,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  updateProfilePicture,
  removeFollower,
};
