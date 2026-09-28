// Loads the LEKSFIT catalogue from db/products-seed.json into Postgres.
//
//   npm run db:seed
//
// Safe to run more than once: a product whose slug already exists is skipped,
// so nothing is duplicated and nothing Lekan has edited in /admin is overwritten.
// Prices are left at 0, which the site shows as "Price on WhatsApp".
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pool = require('./pool');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products-seed.json'), 'utf8'));

async function run() {
  let added = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    const existing = await pool.query('SELECT id FROM products WHERE slug = $1', [p.slug]);
    if (existing.rows.length > 0) {
      skipped += 1;
      continue;
    }

    // the shop lists newest first, so earlier entries in the JSON get a slightly
    // newer created_at and show up at the top
    const { rows } = await pool.query(
      `INSERT INTO products
         (name, slug, category, subcategory, price, description, material, colours, sizes, in_stock, featured, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now() - ($12 * interval '1 second'))
       RETURNING id`,
      [
        p.name, p.slug, p.category, p.subcategory, p.price, p.description, p.material,
        p.colours, p.sizes, p.in_stock, p.featured, i
      ]
    );

    for (let n = 0; n < p.images.length; n++) {
      await pool.query('INSERT INTO product_images (product_id, url, position) VALUES ($1,$2,$3)', [
        rows[0].id, p.images[n], n
      ]);
    }
    added += 1;
  }

  console.log(`Products added: ${added}, already there (skipped): ${skipped}`);
  await pool.end();
}

run().catch((err) => {
  console.error('Could not seed products:', err.message);
  process.exit(1);
});
