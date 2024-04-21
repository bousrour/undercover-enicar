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
const turnQueue = {};  // Queue for managing turns

io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    const { room, username } = data;
    socket.join(room);
    if (!roomUsers[room]) {
      roomUsers[room] = {};
      turnQueue[room] = [];
    }
    roomUsers[room][socket.id] = { id: socket.id, username: username, ready: false };
    turnQueue[room].push(socket.id); // Add user to turn queue
    broadcastUserList(room);
    updateTurn(room); // Update turn whenever someone joins
  });

  socket.on("user_ready", (data) => {
    const { room } = data;
    roomUsers[room][socket.id].ready = true;
    broadcastUserList(room);
    startGameIfReady(room);
  });

  socket.on("send_message", (data) => {
    const { room } = data;
    // Check if it's the sender's turn
    if (turnQueue[room][0] === socket.id) {
      io.to(room).emit("receive_message", data);
      advanceTurn(room); // Move to the next turn
    }
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
  socket.on("disconnect", () => {
    Object.keys(roomUsers).forEach(room => {
      if (roomUsers[room][socket.id]) {
        delete roomUsers[room][socket.id];
        turnQueue[room] = turnQueue[room].filter(id => id !== socket.id); // Remove from turn queue
        if (turnQueue[room].length > 0) {
          updateTurn(room); // Update turn if there are still users
        }
        broadcastUserList(room);
      }
    });
  });
});

function broadcastUserList(room) {
  io.to(room).emit("room_users", Object.values(roomUsers[room]));
}

function startGameIfReady(room) {
  const allReady = Object.values(roomUsers[room]).every(user => user.ready);
  if (allReady) {
    io.to(room).emit("start_chat");
    updateTurn(room);
  }
}

function advanceTurn(room) {
  turnQueue[room].push(turnQueue[room].shift()); // Move current to the end
  updateTurn(room);
}

function updateTurn(room) {
  if (turnQueue[room].length > 0) {
    const currentTurnId = turnQueue[room][0];
    const currentTurnUser = roomUsers[room][currentTurnId].username;
    io.to(room).emit("turn_update", { username: currentTurnUser });
  }
}

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});