const express = require('express');
const router = express.Router();

// GET /api/leaderboard?limit=10
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  try {
    const items = await req.redis.zrevrange('leaderboard', 0, limit - 1, 'WITHSCORES');
    const out = [];
    for (let i = 0; i < items.length; i += 2) {
      out.push({ address: items[i], score: parseInt(items[i + 1], 10) });
    }
    return res.json({ ok: true, leaderboard: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'redis error' });
  }
});

module.exports = router;
