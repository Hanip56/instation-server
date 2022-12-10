const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");

// @desc    send message
// @route   POST /api/message
// @access  PRIVATE
const sendMessage = asyncHandler(async (req, res) => {
  if (!req.body.conversationId || !req.body.text) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const { conversationId, text } = req.body;

  try {
    const newMsg = await Message.create({
      conversationId,
      sender: req.user._id,
      text,
    });
    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// @desc    get message
// @route   GET /api/message/:conversationId
// @access  PRIVATE
const getMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  let result = [];

  const messages = await Message.find({ conversationId });

  if (messages) {
    result = messages;
  }
  res.status(201).json(result);
});

module.exports = {
  sendMessage,
  getMessage,
};
