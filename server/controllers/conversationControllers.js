const asyncHandler = require("express-async-handler");
const { findById } = require("../models/Conversation");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @desc    add conversation
// @route   POST /api/conversation
// @access  PRIVATE
const addConversation = asyncHandler(async (req, res) => {
  if (!req.body.receiverId) {
    res.status(400);
    throw new Error("Please add the 'receiverId' field");
  }

  const convExist = await Conversation.find({
    members: { $in: req.body.receiverId },
  });
  console.log(convExist);

  if (convExist.length > 0) {
    throw new Error("Conversation already exist");
  }

  try {
    const newConv = await Conversation.create({
      members: [req.user._id, req.body.receiverId],
    });

    const result = await newConv.populate({
      path: "members",
      select: "_id username profilePicture",
    });

    console.log(result);

    res.status(201).json(result);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    get conversation user
// @route   GET /api/conversation
// @access  PRIVATE
const getConversationUser = asyncHandler(async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.user._id] },
    }).populate({
      path: "members",
      select: "_id username profilePicture",
    });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    delete conversation
// @route   DELETE /api/conversation/:conversationId
// @access  PRIVATE
const deleteConversation = asyncHandler(async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId);

    if (!conv) {
      res.status(404);
      throw new Error("Conversation not found");
    }

    await conv.remove();

    await Message.deleteMany({ conversationId: req.params.conversationId });

    // await messages?.remove();

    res.status(200).json(conv._id);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

module.exports = {
  addConversation,
  getConversationUser,
  deleteConversation,
};
