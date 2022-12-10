const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc    register user
// @route   POST /api/auth
// @access  PUBLIC
const register = asyncHandler(async (req, res) => {
  const { email, username, fullname, password, gender } = req.body;

  const userExist = await User.findOne({ email }).select("+password");

  if (userExist) {
    res.status(400);
    throw new Error("User already exist");
  }

  let user;

  try {
    user = await User.create({
      fullname,
      username,
      email,
      password,
      gender,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json({
    token: user.getSignedToken(),
  });
});

// @desc    login user
// @route   POST /api/auth
// @access  PUBLIC
const login = asyncHandler(async (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  res.status(200).json({
    token: user.getSignedToken(),
  });
});

// @desc    getMe user
// @route   POST /api/auth
// @access  PUBLIC
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

module.exports = { register, login, getMe };
