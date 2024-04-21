const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);
const mots = [
  ["Pomme", "Poire"],
  ["Chaise", "Canapé"],
  ["Océan", "Lac"],
  ["Éléphant", "Hippopotame"],
  ["Voiture", "Camion"],
  ["Livre", "Magazine"],
  ["Montagne", "Colline"],
  ["Guitare", "Violon"],
  ["Glace", "Yaourt"],
  ["Chaussure", "Botte"],
  ["Horloge", "Montre"],
  ["Soleil", "Lune"],
  ["Oiseau", "Chauve-souris"],
  ["Fleur", "Mauvaise herbe"],
  ["Tasse", "Mug"],
  ["Crayon", "Stylo"],
  ["Fraise", "Framboise"],
  ["Train", "Bus"],
  ["Veste", "Manteau"],
  ["Chocolat", "Bonbon"]
]
;
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const roomUsers = {};  // User data by room

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  const broadcastUserList = (room) => {
    if (room in roomUsers) {
      io.to(room).emit("room_users", Object.values(roomUsers[room]));
    }
  };

  socket.on("join_room", (data) => {
    const { room, username } = data;
    socket.join(room);
    if (!roomUsers[room]) {
      roomUsers[room] = {};
    }
    roomUsers[room][socket.id] = { id: socket.id, username: username, ready: false };
    console.log(`User with ID: ${socket.id}, Username: ${username} joined room: ${room}`);
    broadcastUserList(room);
  });

  socket.on("user_ready", (data) => {
    const { room } = data;
    if (room in roomUsers && socket.id in roomUsers[room]) {
      roomUsers[room][socket.id].ready = true;
      console.log(`User ${roomUsers[room][socket.id].username} is ready in room: ${room}`);
      broadcastUserList(room);

      const allReady = Object.values(roomUsers[room]).every(user => user.ready);
      if (allReady) {
        const wordPair = mots[Math.floor(Math.random() * mots.length)];
        const userKeys = Object.keys(roomUsers[room]);
        const specialUserIndex = Math.floor(Math.random() * userKeys.length);

        userKeys.forEach((key, index) => {
          const wordToSend = index === specialUserIndex ? wordPair[1] : wordPair[0];
          io.to(key).emit("assigned_word", wordToSend);
        });

        console.log(`Words sent to room: ${room}`);
        io.to(room).emit("start_chat");
      }
    }
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    Object.keys(roomUsers).forEach(room => {
      if (roomUsers[room][socket.id]) {
        const userData = roomUsers[room][socket.id];
        delete roomUsers[room][socket.id];
        console.log(`User Disconnected: ${socket.id}`);
        if (Object.keys(roomUsers[room]).length === 0) {
          delete roomUsers[room];
        } else {
          broadcastUserList(room);
        }
      }
    });
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});