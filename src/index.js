// Import core and third-party modules
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words"); // Used to filter profanity from messages

// Import utility functions for generating messages and managing users
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
// Create an HTTP server instance using the Express app
const server = http.createServer(app);
// Attach Socket.IO to the HTTP server
const io = socketio(server);

// Set the port to an environment variable or default to 3000
const port = process.env.PORT || 3000;
// Define the path to the public directory for static files
const publicDirectoryPath = path.join(__dirname, "../public");

// Serve static files from the public directory
app.use(express.static(publicDirectoryPath));

// Listen for new client connections
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  // Listen for a 'join' event when a user joins a chat room
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error); // Send error back to client if any
    }

    socket.join(user.room); // Join the user to the specified room

    // Send a welcome message to the user who just joined
    socket.emit("message", generateMessage("Admin", "Welcome!"));

    // Notify other users in the room that a new user has joined
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );

    // Update room data (e.g. list of users) for all clients in the room
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback(); // Acknowledge the join event
  });

  // Listen for 'sendMessage' event when a user sends a message
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    // Check for profanity and reject if found
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    // Broadcast the message to all users in the room
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback(); // Acknowledge the message was delivered
  });

  // Listen for 'sendLocation' event when a user shares their location
  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    // Broadcast location message with a Google Maps link
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback(); // Acknowledge the location was shared
  });

  // Handle disconnection (when a user leaves)
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      // Notify others in the room that a user has left
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      // Update room data for remaining users
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
