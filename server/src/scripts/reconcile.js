const db = require('../../src/db');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function reconcile() {
  const { rows } = await db.query('SELECT match_id, COUNT(*) as cnt FROM stakes GROUP BY match_id');
  for (const r of rows) {
    await redis.hset('match_stakes', String(r.match_id), String(r.cnt));
    console.log('reconciled', r.match_id, r.cnt);
  }
  process.exit(0);
}

reconcile().catch(e => { console.error(e); process.exit(1); });
