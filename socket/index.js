const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

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
];

const roomUsers = {};
const turnQueue = {};
const userVotes = {};
const turnsTaken = {};
const userWords = {};

io.on("connection", (socket) => {
  socket.on("join_room", (data) => {
    const { room, username } = data;
    socket.join(room);
    if (!roomUsers[room]) {
      roomUsers[room] = {};
      turnQueue[room] = [];
      userVotes[room] = {};
      turnsTaken[room] = 0;
      userWords[room] = {};
    }
    roomUsers[room][socket.id] = { id: socket.id, username: username, ready: false };
    turnQueue[room].push(socket.id);
    broadcastUserList(room);
    updateTurn(room);
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
            // All players have taken their turn, enable voting
            io.to(room).emit("enable_voting");
            // Reset the turnsTaken for the next round
            turnsTaken[room] = 0;
        }
    }
});
  socket.on("cast_vote", (data) => {
    const { room, userId } = data;
    // Ensure that the user hasn't already voted
    if (!userVotes[room][socket.id]) {
        userVotes[room][socket.id] = userId;

        // Check if all users have voted
        if (Object.keys(userVotes[room]).length === Object.keys(roomUsers[room]).length) {
            countVotes(room);
        }
    }
});
  socket.on("disconnect", () => {
    Object.keys(roomUsers).forEach(room => {
      if (roomUsers[room][socket.id]) {
        delete roomUsers[room][socket.id];
        turnQueue[room] = turnQueue[room].filter(id => id !== socket.id);
        broadcastUserList(room);
        if (turnQueue[room].length > 0) {
          updateTurn(room);
        }
      }
    });
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
    assignWordsAndStartGame(room);
  }
}

function assignWordsAndStartGame(room) {
  const wordPair = mots[Math.floor(Math.random() * mots.length)];
  const userKeys = Object.keys(roomUsers[room]);
  const specialUserIndex = Math.floor(Math.random() * userKeys.length);
  const specialUserId = userKeys[specialUserIndex];

  userKeys.forEach((key, index) => {
    userWords[room][key] = index === specialUserIndex ? wordPair[1] : wordPair[0];
    io.to(key).emit("assigned_word", userWords[room][key]);
  });

  roomUsers[room][specialUserId].isImposter = true;
  io.to(room).emit("start_chat");

  // Check if starting with only two players
  if (userKeys.length === 2) {
    checkForImposterWin(room);
  }
}
function advanceTurn(room) {
  turnQueue[room].push(turnQueue[room].shift());
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
  evaluateVotes(room, voteCounts);
}

function evaluateVotes(room, voteCounts) {
  let mostVotes = 0;
  let mostVotedUserId = null;

  // Determine who got the most votes
  for (let userId in voteCounts) {
    if (voteCounts[userId] > mostVotes) {
      mostVotes = voteCounts[userId];
      mostVotedUserId = userId;
    }
  }

  if (mostVotedUserId && roomUsers[room][mostVotedUserId]) {
    if (roomUsers[room][mostVotedUserId].isImposter) {
      // If the imposter is caught, send them a "you lost" message and "you won" to others
      Object.keys(roomUsers[room]).forEach(id => {
        if (id === mostVotedUserId) {
          io.to(id).emit("you_lost", { message: "Vous avez perdu!" });
        } else {
          io.to(id).emit("congratulations", { message: "Félicitations! Vous avez gagné!" });
        }
      });
      resetGame(room);
    } else {
      // If a non-imposter was wrongly voted out, continue the game
      io.to(mostVotedUserId).emit("you_lost", { message: "Vous avez été éliminé et avez perdu!" });
      delete roomUsers[room][mostVotedUserId];
      turnQueue[room] = turnQueue[room].filter(id => id !== mostVotedUserId);
      broadcastUserList(room);
      updateTurn(room);
      io.to(room).emit("reset_voting");
      checkForImposterWin(room);
    }
  } else {
    // Handle case where the most voted user might have disconnected
    io.to(room).emit("error", { message: "The voted user has disconnected or does not exist." });
  }

  // Reset the votes for this room
  userVotes[room] = {};
}
function checkForImposterWin(room) {
  const remainingPlayers = Object.keys(roomUsers[room]);
  if (remainingPlayers.length === 2) {
    const imposter = remainingPlayers.find(playerId => roomUsers[room][playerId].isImposter);
    if (imposter) {
      // Loop through the remaining players
      remainingPlayers.forEach(playerId => {
        if (playerId === imposter) {
          io.to(playerId).emit("congratulations", { message: "felicitation! vous avez gangner!" });
                } else {
          
          io.to(playerId).emit("game_over1", { message: "vous aver perdu." });

        }
      });
      resetGame(room);
    }
  }
}

function resetGame(room) {
  delete roomUsers[room];
  delete turnQueue[room];
  delete userVotes[room];
  delete turnsTaken[room];
  delete userWords[room];
}

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
