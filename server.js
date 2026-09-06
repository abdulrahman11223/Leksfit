require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const pool = require('./db/pool');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const adminProductsRouter = require('./routes/admin-products');

const app = express();

// Render (and most hosts) put your app behind a proxy that handles HTTPS.
// Without this, Express thinks every request is plain HTTP, so it refuses
// to set the secure session cookie — which is why logins looked like they
// worked but never actually stuck.
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use('/api/products', productsRouter);
app.use('/api/admin', authRouter);
app.use('/api/admin/products', adminProductsRouter);

// customer-facing site
app.use(express.static(path.join(__dirname, 'public')));

// admin dashboard (separate static folder, its own login gate on the frontend)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
    if (err) res.status(404).send('Page not found');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LEKSFIT server running on port ${PORT}`));
