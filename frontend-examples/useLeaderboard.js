const axios = require('axios');

async function fetchLeaderboard(limit = 10) {
  const res = await axios.get((process.env.API_URL || 'http://localhost:3001') + '/api/leaderboard?limit=' + limit);
  return res.data.leaderboard;
}

module.exports = { fetchLeaderboard };
