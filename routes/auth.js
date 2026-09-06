const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  const admin = rows[0];
  const ok = await bcrypt.compare(password || '', admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  req.session.isAdmin = true;
  req.session.adminId = admin.id;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.isAdmin) return res.json({ loggedIn: false });

  const { rows } = await pool.query('SELECT username FROM admin_users WHERE id = $1', [req.session.adminId]);
  res.json({ loggedIn: true, username: rows[0] ? rows[0].username : null });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password needs to be at least 6 characters' });
  }

  const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.session.adminId]);
  const admin = rows[0];

  const ok = await bcrypt.compare(currentPassword || '', admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is wrong' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, admin.id]);

  res.json({ ok: true });
});

module.exports = router;
