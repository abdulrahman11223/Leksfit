const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET /api/products?category=clothing&subcategory=Agbada&search=navy&minPrice=20000&maxPrice=80000&featured=true
router.get('/', async (req, res) => {
  const { category, subcategory, search, minPrice, maxPrice, featured } = req.query;

  const clauses = ['in_stock = true'];
  const values = [];

  if (category && category !== 'all') {
    values.push(category);
    clauses.push(`category = $${values.length}`);
  }
  if (subcategory && subcategory !== 'all') {
    values.push(subcategory);
    clauses.push(`subcategory = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  if (minPrice) {
    values.push(Number(minPrice));
    clauses.push(`price >= $${values.length}`);
  }
  if (maxPrice) {
    values.push(Number(maxPrice));
    clauses.push(`price <= $${values.length}`);
  }
  if (featured === 'true') {
    clauses.push('featured = true');
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows: products } = await pool.query(
    `SELECT * FROM products ${where} ORDER BY created_at DESC`,
    values
  );

  if (products.length === 0) return res.json([]);

  const ids = products.map((p) => p.id);
  const { rows: images } = await pool.query(
    `SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY position ASC`,
    [ids]
  );

  const withImages = products.map((p) => ({
    ...p,
    images: images.filter((img) => img.product_id === p.id).map((img) => img.url)
  }));

  res.json(withImages);
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE slug = $1', [req.params.slug]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const product = rows[0];
  const { rows: images } = await pool.query(
    'SELECT url FROM product_images WHERE product_id = $1 ORDER BY position ASC',
    [product.id]
  );

  res.json({ ...product, images: images.map((img) => img.url) });
});

module.exports = router;
