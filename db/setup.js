require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);

  // first-run only — if an admin already exists (e.g. Lekan already changed
  // his password), this does nothing and leaves it alone
  const hash = bcrypt.hashSync('admin', 10);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash) VALUES ('admin', $1)
     ON CONFLICT (username) DO NOTHING`,
    [hash]
  );

  console.log('Database is set up — tables created (or already existed).');
  console.log('Default login: username "admin", password "admin" — change it from the dashboard after first login.');
  await pool.end();
}

run().catch((err) => {
  console.error('Could not set up the database:', err.message);
  process.exit(1);
});

