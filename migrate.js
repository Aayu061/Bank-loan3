// migrate.js - create required tables
const { pool } = require('./db');

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  email TEXT,
  when_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async () => {
  try {
    await pool.query(sql);
    console.log('Migrations applied');
  } catch (err) {
    console.error('Migration failed', err && err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
/*
  Run: set DATABASE_URL=your_db_url; node migrate.js
  or configure .env with DATABASE_URL and run: npm run migrate
*/
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);
}

async function appliedMigrations() {
  const r = await db.query('SELECT filename FROM schema_migrations');
  return new Set(r.rows.map(r => r.filename));
}

async function applyMigration(filename, sql) {
  console.log('Applying', filename);
  await db.pool.query(sql);
  await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
}

async function run() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('No migrations directory found:', migrationsDir);
      process.exit(1);
    }

    await ensureMigrationsTable();
    const applied = await appliedMigrations();

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      if (applied.has(f)) {
        console.log('Skipping already applied:', f);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      await applyMigration(f, sql);
    }

    console.log('All migrations applied.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    try { await db.pool.end(); } catch (e) {}
  }
}

run();
