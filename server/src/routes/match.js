const express = require('express');
const router = express.Router();
const { verifyTransaction } = require('../verifyOnChain');

// POST /api/match/result
// body: { txid, match_id }
router.post('/result', async (req, res) => {
  const { txid, match_id } = req.body || {};
  if (!txid || !match_id) return res.status(400).json({ error: 'txid and match_id required' });

  const { verified, tx, error } = await verifyTransaction(txid);
  if (!verified) return res.status(400).json({ error: 'tx verification failed', details: error });

  const client = await req.db.getClient();
  try {
    await client.query('BEGIN');

    // Insert a proof row
    await client.query(
      `INSERT INTO match_proofs(match_id, txid, payload) VALUES($1, $2, $3)`,
      [match_id, txid, JSON.stringify(tx || {})]
    );

    // update match as settled
    await client.query(`UPDATE matches SET settled = TRUE WHERE id = $1`, [match_id]);

    await client.query('COMMIT');

    // update leaderboard in redis and emit event
    try {
      // this is an example: increment winner's score if payload contains winner_address
      const winner = tx?.transaction?.txn?.snd || null;
      if (winner) {
        await req.redis.zincrby('leaderboard', 1, winner.toString('hex'));
        req.io.emit('match:settled', { match_id, winner });
      } else {
        req.io.emit('match:settled', { match_id });
      }
    } catch (e) {
      console.warn('redis update failed', e.message || e);
    }

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
