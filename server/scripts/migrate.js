const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/yield_router' });

async function runMigrations() {
  const dir = path.resolve(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    for (const file of files) {
      console.log('Running', file);
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query(sql);
    }
    console.log('Migrations applied');
  } catch (err) {
    console.error('migration failed', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrations();
