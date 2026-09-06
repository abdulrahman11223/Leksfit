# LEKSFIT Signature — full site

Customer-facing shop (`/public`) + Lekan's admin dashboard (`/admin`) + a
Node/Express/Postgres backend tying them together.

## What's in here

```
server.js            # Express app
routes/               # API endpoints
  products.js          public product list + detail
  auth.js               admin login/logout
  admin-products.js     admin product CRUD + image upload (protected)
middleware/auth.js     # blocks admin routes unless logged in
db/
  schema.sql            table definitions
  pool.js               postgres connection
  setup.js              run schema.sql against DATABASE_URL
  create-admin.js        create or reset an admin login (username + password)
  cloudinary.js          image upload helper
  slugify.js
public/                # the customer site (was your preview, now dynamic)
  index.html, shop.html, custom.html, product.html, cart.html
  js/cart.js             cart stored in the browser (localStorage) + WhatsApp message builder
  js/shop.js, product.js, featured.js, cart-page.js
admin/                 # Lekan's dashboard, plain HTML/JS, no framework
  login.html, index.html, js/admin.js, css/admin.css
```

## 1. Accounts you need (all have free tiers)

**Database — Neon** (postgres.new / neon.tech)
1. Sign up, create a project. It gives you a connection string that looks like
   `postgres://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`
2. Copy that into `DATABASE_URL` in your `.env`.

**Images — Cloudinary** (cloudinary.com)
1. Sign up, go to the Dashboard — it shows Cloud Name, API Key, API Secret.
2. Put those three into `.env`.

**Hosting — Render** (render.com), once you're ready to go live
1. New → Web Service → connect your GitHub repo
2. Build command: `npm install`  ·  Start command: `npm start`
3. Add the same environment variables from your `.env` in Render's dashboard.

## 2. Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your Neon + Cloudinary values

# create the tables — this also creates a starter login: admin / admin
npm run db:setup

# run it
npm run dev
```

Visit `http://localhost:3000` for the shop, `http://localhost:3000/admin` for
the dashboard — log in with **username `admin`, password `admin`**. Tell
Lekan to change that password the first time he logs in (there's a "Change
password" button right in the header) — from then on it's his own, and
you never touch `.env` or redeploy for it to update.

If he ever forgets his password, run
`node db/create-admin.js admin "<newPassword>"` to reset it back to
something you both know, then he can change it again from the dashboard.

## 3. How it fits together

- **Products live in Postgres**, not in the HTML anymore. Lekan adds a piece
  in `/admin`, it's saved to the database with its photos on Cloudinary, and
  it shows up on `/shop.html` immediately — no code changes needed.
- **The cart is entirely client-side** (`localStorage`) — no accounts, no
  checkout, no payment gateway. When someone hits "Order on WhatsApp" on the
  cart page, it builds a message listing every item, size and the total, and
  opens `wa.me` with it pre-filled, same idea as the old single-item links but
  for the whole cart at once.
- **Admin auth** lives in an `admin_users` table — one row for Lekan, created
  once via `create-admin.js`. He can change his own password from the
  dashboard; there's just no self-serve "forgot password" flow, so if he
  loses it, whoever has server access reruns `create-admin.js` to reset it.
  The session itself is stored in Postgres (`connect-pg-simple`) so it
  survives server restarts.

## 4. What's intentionally left out of this version

- No payment gateway — matches the brief (WhatsApp confirms availability first).
- No image deletion from Cloudinary when a product is deleted (only the DB
  record and reference are removed — the file sits unused on Cloudinary,
  which is fine on the free tier but worth knowing).
- No multi-admin accounts. If Lekan ever wants staff logins, that's a real
  users table + role field — not hard to add later, just not needed yet.

## 5. Next once this is live

- Point your domain at Render (or wherever you deploy).
- Have Lekan add his real catalogue through `/admin` — the preview's category
  labels (Agbada / Senator Wear / Caftan & Sets) already match the dropdown
  in the dashboard, so nothing to rename on his end.
