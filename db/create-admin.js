// Creates the first admin login, or resets the password if the username
// already exists. Run once during setup:
//   node db/create-admin.js lekan "somePassword"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function run() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.log('Usage: node db/create-admin.js <username> "<password>"');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);

  await pool.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, hash]
  );

  console.log(`Admin login ready — username "${username}".`);
  await pool.end();
}

run().catch((err) => {
  console.error('Could not create admin user:', err.message);
  process.exit(1);
});
