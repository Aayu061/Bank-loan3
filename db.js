const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/nexa_db';
const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

const pool = new Pool({ connectionString, ssl });

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if(!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set. Some DB operations will fail.');
}

const pool = new Pool({
  connectionString,
  ssl: (process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
});

if (process.env.NODE_ENV === 'production') {
  console.log('DB: Using production SSL configuration for Postgres connection');
} else {
  console.log('DB: Running in development mode; SSL for Postgres is disabled');
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
