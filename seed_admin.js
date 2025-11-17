const bcrypt = require('bcrypt');
const { query, pool } = require('../db');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'nexa.bank06@gmail.com';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'Nexa@123';

(async () => {
  try {
    // Check if users table exists / create via migrate.js first
    const r = await query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL.toLowerCase()]);
    if (r && r.rows && r.rows.length) {
      console.log('Admin already exists. Updating password to provided value.');
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      await query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, 'admin', ADMIN_EMAIL.toLowerCase()]);
      console.log('Admin password updated.');
    } else {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      await query('INSERT INTO users (first_name, email, password_hash, role) VALUES ($1, $2, $3, $4)', ['Admin', ADMIN_EMAIL.toLowerCase(), hash, 'admin']);
      console.log('Seeded admin user:', ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('Failed to seed admin:', err && err.message);
  } finally {
    await pool.end();
  }
})();
/**
 * Creates an initial admin user if no admin exists.
 * Usage: node scripts/seed_admin.js
 * Set env vars or use .env with DATABASE_URL and ADMIN_PASSWORD/ADMIN_EMAIL
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nexa.bank06@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nexa@123';
const FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Nexa';
const LAST_NAME = process.env.ADMIN_LAST_NAME || 'Bank';

async function run() {
  try {
    const r = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (r.rows.length) {
      console.log('Admin user already exists:', r.rows[0].id);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const inserted = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,'admin') RETURNING id, email`,
      [FIRST_NAME, LAST_NAME, ADMIN_EMAIL.toLowerCase(), hash]
    );

    console.log('Admin user created:', inserted.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  } finally {
    try { await db.pool.end(); } catch (e) {}
  }
}

run();
