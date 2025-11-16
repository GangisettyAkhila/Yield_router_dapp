const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/yield_router' });

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
