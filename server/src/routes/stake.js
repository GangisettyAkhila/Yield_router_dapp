const express = require('express');
const router = express.Router();
const { verifyTransaction } = require('../verifyOnChain');

// POST /api/stake/confirm
// body: { txid, match_id, staker }
router.post('/confirm', async (req, res) => {
  const { txid, match_id, staker } = req.body || {};
  if (!txid || !match_id || !staker) return res.status(400).json({ error: 'txid, match_id, staker required' });

  const { verified, tx, error } = await verifyTransaction(txid);
  if (!verified) return res.status(400).json({ error: 'tx verification failed', details: error });

  const client = await req.db.getClient();
  try {
    await client.query('BEGIN');

    // insert stake
    await client.query(
      `INSERT INTO stakes(match_id, staker, txid, amount) VALUES($1, $2, $3, $4)`,
      [match_id, staker, txid, 0]
    );

    // simplistic: increment Redis total stake for match
    try {
      await req.redis.hincrby('match_stakes', String(match_id), 1);
      req.io.emit('stake:confirmed', { match_id, staker });
    } catch (e) {
      console.warn('redis update failed', e.message || e);
    }

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'internal error', details: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
