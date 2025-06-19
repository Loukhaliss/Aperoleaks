const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};
const ROUND_DURATION_MS = 30_000;

function startRound(code) {
  const room = rooms[code];
  if (!room || room.mediaQueue.length === 0) return false;

  const randomIndex = Math.floor(Math.random() * room.mediaQueue.length);
  room.currentMedia = room.mediaQueue.splice(randomIndex, 1)[0];
  room.denunciations = [];
  room.votes = [];

  room.roundNumber = (room.roundNumber || 0) + 1;

  io.to(code).emit("game_started");
  io.to(code).emit("current_round", {
    media: room.currentMedia,
    players: room.players,
    roundNumber: room.roundNumber,
  });

  console.log(`🎬 Nouvelle manche #${room.roundNumber} lancée dans ${code}`);

  if (room.roundTimer) clearTimeout(room.roundTimer);
  room.roundTimer = setTimeout(() => {
    io.to(code).emit("round_ended");
    io.to(code).emit("vote_phase");
    console.log(`⏰ Round terminé et passage au vote dans ${code}`);
  }, ROUND_DURATION_MS);

  return true;
}

io.on("connection", (socket) => {
  console.log("🟢 Connexion :", socket.id);

  socket.on("join_room", ({ code, pseudo, avatar }) => {
    if (!pseudo || typeof pseudo !== "string") {
      socket.emit("error", "Pseudo invalide");
      return;
    }

    if (!rooms[code]) {
      rooms[code] = {
        players: [],
        mediaQueue: [],
        currentMedia: null,
        denunciations: [],
        votes: [],
        roundTimer: null,
        roundNumber: 0,
      };
    }

    const room = rooms[code];
    const existingPlayer = room.players.find((p) => p.pseudo === pseudo);

    if (existingPlayer && existingPlayer.id !== socket.id) {
      socket.emit("error", "Pseudo déjà utilisé dans la room");
      return;
    }

    socket.data.roomCode = code;
    socket.data.pseudo = pseudo;

    if (existingPlayer) {
      existingPlayer.id = socket.id;
    } else {
      room.players.push({
        pseudo,
        id: socket.id,
        avatar,
        drinksGiven: 0,
        drinksTaken: 0,
        timesTargeted: 0,
        timesCorrect: 0,
        timesWrong: 0,
        timesDenounced: 0,
      });
    }

    socket.join(code);
    console.log(`👥 ${pseudo} rejoint ${code}`);
    io.to(code).emit("room_update", room.players);
  });

  socket.on("submit_posts", ({ code, posts }) => {
    const room = rooms[code];
    if (!room || !Array.isArray(posts)) return;
    posts.forEach((media) => room.mediaQueue.push(media));
    console.log(`📥 ${posts.length} post(s) ajoutés à ${code}`);
  });

  socket.on("start_game", (code) => {
    if (!startRound(code)) {
      socket.emit("error", "Impossible de démarrer le round");
    }
  });

  socket.on("add_media", ({ code, media }) => {
    const room = rooms[code];
    if (!room || !media) return;
    room.mediaQueue.push(media);
    console.log(`📦 Média ajouté dans ${code}`);
  });

  socket.on("get_current_round", (code) => {
    const room = rooms[code];
    if (room?.currentMedia) {
      socket.emit("current_round", {
        media: room.currentMedia,
        players: room.players,
        roundNumber: room.roundNumber,
      });
    }
  });

  socket.on("denounce", ({ code, from, target }) => {
    const room = rooms[code];
    if (!room) return;

    room.denunciations.push({ from, target });
    const targetPlayer = room.players.find(p => p.pseudo === target);
    if (targetPlayer) targetPlayer.timesDenounced++;

    const targetSocket = targetPlayer?.id;
    if (targetSocket) {
      io.to(targetSocket).emit("denounced", { from });
    }

    console.log(`🚨 ${from} a dénoncé ${target} dans ${code}`);
  });

  socket.on("get_players", (code) => {
    const room = rooms[code];
    if (room) {
      socket.emit("players_list", room.players);
    }
  });

  socket.on("vote", ({ code, from, target }) => {
    const room = rooms[code];
    if (!room) return;

    const alreadyVoted = room.votes.some((v) => v.from === from);
    if (alreadyVoted) return;

    room.votes.push({ from, target });

    const authorPseudo = room.currentMedia?.author;
    const isCorrect = target === authorPseudo;

    const voter = room.players.find(p => p.pseudo === from);
    const voted = room.players.find(p => p.pseudo === target);

    if (voter) {
      if (isCorrect) {
        voter.timesCorrect++;
        voter.drinksGiven += room.currentMedia.difficulty || 1;
      } else {
        voter.timesWrong++;
        voter.drinksTaken += room.currentMedia.difficulty || 1;
      }
    }
    if (voted) voted.timesTargeted++;

    socket.emit("vote_confirmed", { target });
    console.log(`✅ ${from} a voté pour ${target} dans ${code}`);
  });

  socket.on("reveal_votes", (code) => {
    const room = rooms[code];
    if (!room || !room.currentMedia) return;

    const { author: authorPseudo, difficulty } = room.currentMedia;
    const author = room.players.find((p) => p.pseudo === authorPseudo);

    const voteResults = room.votes.map(({ from, target }) => {
      const correct = target === authorPseudo;
      return {
        name: from,
        choice: target,
        correct,
        action: correct
          ? `distribue ${difficulty} gorgée(s)`
          : `boit ${difficulty} gorgée(s)`,
      };
    });

    io.to(code).emit("votes_revealed", {
      author,
      difficulty,
      results: voteResults,
      players: room.players,
      hasMoreMedia: room.mediaQueue.length > 0,
    });

    console.log(`🎯 Révélation votes dans ${code} — Auteur : ${author?.pseudo}`);
    room.votes = [];
  });

  socket.on("request_reveal", (code) => {
    const room = rooms[code];
    if (!room || !room.currentMedia) return;

    const { author: authorPseudo, difficulty } = room.currentMedia;
    const author = room.players.find((p) => p.pseudo === authorPseudo);

    const voteResults = room.votes.map(({ from, target }) => {
      const correct = target === authorPseudo;
      return {
        name: from,
        choice: target,
        correct,
        action: correct
          ? `distribue ${difficulty} gorgée(s)`
          : `boit ${difficulty} gorgée(s)`,
      };
    });

    socket.emit("votes_revealed", {
      author,
      difficulty,
      results: voteResults,
      players: room.players,
      hasMoreMedia: room.mediaQueue.length > 0,
    });
  });

  socket.on("get_end_stats", (code) => {
    const room = rooms[code];
    if (!room) return;
    socket.emit("end_stats", room.players);
  });

  socket.on("go_to_end", (code) => {
    const room = rooms[code];
    if (!room) return;
    io.to(code).emit("end_game");
    console.log(`🏁 Fin de partie déclenchée dans ${code}`);
  });

  socket.on("next_round", (code) => {
    if (!startRound(code)) {
      socket.emit("error", "Pas assez de médias pour continuer");
    }
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (!room) continue;

      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
        const [leaver] = room.players.splice(idx, 1);
        io.to(code).emit("room_update", room.players);
        console.log(`❌ ${leaver.pseudo} déconnecté de ${code}`);

        if (room.players.length === 0) {
          if (room.roundTimer) clearTimeout(room.roundTimer);
          delete rooms[code];
          console.log(`🗑️ Room ${code} supprimée`);
        }
      }
    }
    console.log("🔴 Déconnecté :", socket.id);
  });
});

// ✅ PORT dynamique pour Render.com
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur Socket.IO prêt sur le port ${PORT}`);
});
