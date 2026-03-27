const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const games = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', ({ gameId, cells, mode, hostPlayer }) => {
    games[gameId] = {
      id: gameId,
      mode,
      cells, // The pool of words (at least 25)
      sharedBoard: mode === 'fast-click' ? cells.map((text, i) => ({ id: i, text, owner: null })) : null,
      players: {
        [socket.id]: { ...hostPlayer, score: 0, socketId: socket.id }
      },
      events: [] // Chat or logs
    };
    socket.join(gameId);
    socket.emit('gameJoined', { game: games[gameId], socketId: socket.id });
  });

  socket.on('joinGame', ({ gameId, player }) => {
    if (games[gameId]) {
      games[gameId].players[socket.id] = { ...player, score: 0, socketId: socket.id };
      socket.join(gameId);
      io.to(gameId).emit('gameState', games[gameId]);
      socket.emit('gameJoined', { game: games[gameId], socketId: socket.id });
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('clickCell', ({ gameId, cellId }) => {
    const game = games[gameId];
    if (!game) return;

    if (game.mode === 'fast-click') {
      const cell = game.sharedBoard.find(c => c.id === cellId);
      if (cell) {
        if (cell.owner) {
          socket.emit('clickFailed', { message: 'Another player already claimed this cell!' });
        } else {
          cell.owner = socket.id;
          game.players[socket.id].score += 10;
          game.events.push(`${game.players[socket.id].name} claimed "${cell.text}"`);
          io.to(gameId).emit('gameState', game);
        }
      }
    } else {
      // Casual mode: Update score for leaderboard
      game.players[socket.id].score += 10;
      io.to(gameId).emit('gameState', game);
    }
  });

  socket.on('initiateDispute', ({ gameId, cellId }) => {
    const game = games[gameId];
    if (!game || game.mode !== 'fast-click') return;
    const cell = game.sharedBoard.find(c => c.id === cellId);
    if (!cell || !cell.owner) return; // Can't dispute unclaimed cell

    game.disputes = game.disputes || {};
    if (game.disputes[cellId]) return; // Already being disputed

    game.disputes[cellId] = {
      initiator: socket.id,
      targetOwner: cell.owner,
      votes: {},
      timer: setTimeout(() => resolveDispute(gameId, cellId), 15000)
    };

    io.to(gameId).emit('disputeStarted', { 
      cellId, 
      cellText: cell.text, 
      initiatorName: game.players[socket.id].name,
      ownerName: game.players[cell.owner].name
    });
  });

  socket.on('voteDispute', ({ gameId, cellId, vote }) => {
    const game = games[gameId];
    if (!game || !game.disputes || !game.disputes[cellId]) return;
    game.disputes[cellId].votes[socket.id] = vote;
    
    if (Object.keys(game.disputes[cellId].votes).length === Object.keys(game.players).length) {
      clearTimeout(game.disputes[cellId].timer);
      resolveDispute(gameId, cellId);
    }
  });

  function resolveDispute(roomId, targetCellId) {
    const g = games[roomId];
    if (!g || !g.disputes || !g.disputes[targetCellId]) return;

    const dispute = g.disputes[targetCellId];
    let yesVotes = 0;
    Object.values(dispute.votes).forEach(v => {
      if (v) yesVotes++;
    });

    const numPlayers = Object.keys(g.players).length;
    const threshold = numPlayers === 2 ? 2 : Math.floor(numPlayers / 2) + 1;

    const cell = g.sharedBoard.find(c => c.id === targetCellId);
    if (yesVotes >= threshold) {
       if (cell && cell.owner) {
         if (g.players[cell.owner]) g.players[cell.owner].score -= 10;
         cell.owner = null;
         g.events.push(`Dispute succeeded. "${cell.text}" was unclaimed.`);
         io.to(roomId).emit('gameState', g);
       }
       io.to(roomId).emit('disputeResult', { success: true, cellText: cell?.text });
    } else {
       g.events.push(`Dispute failed for "${cell?.text}".`);
       io.to(roomId).emit('gameState', g);
       io.to(roomId).emit('disputeResult', { success: false, cellText: cell?.text });
    }

    delete g.disputes[targetCellId];
  }

  socket.on('disconnect', () => {
    Object.keys(games).forEach(gameId => {
      const game = games[gameId];
      if (game.players[socket.id]) {
        const playerName = game.players[socket.id].name;
        game.events.push(`${playerName} left the game.`);
        delete game.players[socket.id];
        
        // If no players left, we could delete the game, but for now we'll just broadcast
        io.to(gameId).emit('gameState', game);
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
