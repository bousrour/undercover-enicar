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
const userVotes = {}; 
const turnsTaken = {}; 
io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    const { room, username } = data;
    socket.join(room);
    if (!roomUsers[room]) {
      roomUsers[room] = {};
      turnQueue[room] = [];
      userVotes[room] = {}; 
      turnsTaken[room] = 0;
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
    if (turnQueue[room][0] === socket.id) {
        io.to(room).emit("receive_message", data);
        advanceTurn(room);
        turnsTaken[room]++;
        if (turnsTaken[room] >= Object.keys(roomUsers[room]).length) {
          io.to(room).emit("enable_voting");
        }
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
 
  socket.on("cast_vote", (data) => {
    console.log(`Vote received for userId ${data.userId} from ${socket.id} in room ${data.room}`);
    if (!userVotes[data.room][socket.id]) { 
        userVotes[data.room][socket.id] = data.userId;
        countVotes(data.room);
    }
});
  socket.on("disconnect", () => {
    Object.keys(roomUsers).forEach(room => {
      if (roomUsers[room][socket.id]) {
        delete roomUsers[room][socket.id];
        turnQueue[room] = turnQueue[room].filter(id => id !== socket.id);
        if (turnQueue[room].length > 0) {
          updateTurn(room);
        }
        broadcastUserList(room);
      }
    });

    // Clean up votes
    Object.keys(userVotes).forEach(room => {
      if (userVotes[room][socket.id]) {
        delete userVotes[room][socket.id];
        countVotes(room);
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
function countVotes(room) {
  const voteCounts = {};
  Object.values(userVotes[room]).forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
  });
  io.to(room).emit("update_votes", voteCounts);
}
function advanceTurn(room) {
  turnQueue[room].push(turnQueue[room].shift()); // Rotate the queue
  updateTurn(room);
}
server.listen(3001, () => {
  console.log("SERVER RUNNING");
});