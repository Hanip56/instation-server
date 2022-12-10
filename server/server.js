const express = require("express");
const dotenv = require("dotenv").config();
const colors = require("colors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");
const { Server } = require("socket.io");
const path = require("path");
const http = require("http");
const cors = require("cors");

connectDB();
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// socket io //
const io = new Server(server, {
  cors: {
    origin: "*",
    // origin: ["http://localhost:3000", "https://instation.herokuapp.com"],
  },
});

let users = [];

const addUser = (userId, socketId) => {
  console.log("adding");
  if (userId === null) {
    return;
  }
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  // when connect
  console.log(`User connected: ${socket.id}`);

  //   take user id and socket id
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });
  //   send messages
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (!user) {
      return;
    }
    io.to(user.socketId).emit("receiveMessage", {
      senderId,
      text,
    });
  });

  //  when  disconnect
  socket.on("disconnect", () => {
    console.log(`a user with id:${socket.id} has been disconnected`);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
// end socket io //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/post", require("./routes/postRoutes"));
app.use("/api/conversation", require("./routes/convRoutes"));
app.use("/api/message", require("./routes/msgRoutes"));

app.use(errorHandler);

server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
