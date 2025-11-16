require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const db = require('./db');
const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const matchRoutes = require('./routes/match');
const stakeRoutes = require('./routes/stake');
const leaderboardRoutes = require('./routes/leaderboard');
const playerRoutes = require('./routes/player');
const rateLimit = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(rateLimit());

// attach shared resources to req for route handlers
app.use((req, res, next) => {
  req.db = db;
  req.redis = redisClient;
  req.io = io;
  next();
});

app.use('/api/match', matchRoutes);
app.use('/api/stake', stakeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/player', playerRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Yield Router API listening on ${PORT}`);
});
