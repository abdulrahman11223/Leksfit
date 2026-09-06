-- LEKSFIT Signature — database schema

CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL,          -- clothing | monogram | fabric
  subcategory   TEXT DEFAULT '',        -- e.g. Shirts, Agbada, Lace, Monogram Files
  price         INTEGER NOT NULL,       -- naira, whole numbers, no kobo
  description   TEXT DEFAULT '',
  material      TEXT DEFAULT '',
  colours       TEXT[] DEFAULT '{}',
  sizes         TEXT[] DEFAULT '{}',    -- e.g. {S,M,L,XL,XXL}
  in_stock      BOOLEAN NOT NULL DEFAULT true,
  featured      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- safe to re-run: adds the column only if an earlier version of the table
-- (from before subcategories existed) doesn't have it yet
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS product_images (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);

-- session table for connect-pg-simple (it can also create this itself,
-- kept here so `npm run db:setup` sets everything up in one go)
CREATE TABLE IF NOT EXISTS "session" (
  "sid"     VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  "sess"    JSON NOT NULL,
  "expire"  TIMESTAMP(6) NOT NULL
);
