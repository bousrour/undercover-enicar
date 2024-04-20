const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const roomUsers = {};  // Track users and readiness in each room

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  const updateUserList = (room) => {
    const users = Object.values(roomUsers[room] || {});
    io.to(room).emit("room_users", users);
};

  socket.on("join_room", (room) => {
    socket.join(room);
    
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    
    if (!roomUsers[room]) {
      roomUsers[room] = {};
    }
    roomUsers[room][socket.id] = false;  // Mark as not ready by default
  });

  socket.on("user_ready", (data) => {
    const { room, username } = data;
    if (room in roomUsers && socket.id in roomUsers[room]) {
      roomUsers[room][socket.id] = true;  // Mark user as ready
      console.log(`User ${username} is ready in room ${room}`);
      updateUserList(room);
      // Check if all are ready
      const allReady = Object.values(roomUsers[room]).every(status => status === true);
      if (allReady) {
        io.to(room).emit("start_chat");
        console.log(`All users are ready in room ${room}`,);
        
      }
    }
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
    console.log(`Message sent in room ${data.room}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    // Remove user from roomUsers
    for (const room in roomUsers) {
      if (roomUsers[room][socket.id] !== undefined) {
        delete roomUsers[room][socket.id];
        updateUserList(room);
        if (Object.keys(roomUsers[room]).length === 0) {
          delete roomUsers[room];  // Optionally clean up empty room data
        }
      }
    }
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
