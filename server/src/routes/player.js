const express = require('express');
const router = express.Router();

// GET /api/player/:address
router.get('/:address', async (req, res) => {
  const address = req.params.address;
  try {
    const { rows } = await req.db.query('SELECT * FROM player_stats WHERE address = $1', [address]);
    return res.json({ ok: true, stats: rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'db error' });
  }
});

module.exports = router;
