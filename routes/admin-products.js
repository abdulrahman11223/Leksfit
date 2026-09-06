const express = require('express');
const multer = require('multer');
const pool = require('../db/pool');
const slugify = require('../db/slugify');
const { uploadBuffer } = require('../db/cloudinary');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB per image
});

router.use(requireAdmin);

// list everything, including out-of-stock items, for the dashboard table
router.get('/', async (req, res) => {
  const { rows: products } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  const { rows: images } = await pool.query('SELECT * FROM product_images ORDER BY position ASC');

  const withImages = products.map((p) => ({
    ...p,
    images: images.filter((img) => img.product_id === p.id).map((img) => ({ id: img.id, url: img.url }))
  }));

  res.json(withImages);
});

async function uniqueSlug(name, ignoreId) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (true) {
    const { rows } = ignoreId
      ? await pool.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, ignoreId])
      : await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (rows.length === 0) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function parseListField(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

router.post('/', upload.array('images', 10), async (req, res) => {
  const { name, category, subcategory, price, description, material, colours, sizes, in_stock, featured } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category and price are required' });
  }

  const slug = await uniqueSlug(name);

  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, category, subcategory, price, description, material, colours, sizes, in_stock, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      name,
      slug,
      category,
      subcategory || '',
      Number(price),
      description || '',
      material || '',
      parseListField(colours),
      parseListField(sizes),
      in_stock !== 'false',
      featured === 'true'
    ]
  );
  const product = rows[0];

  const files = req.files || [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadBuffer(files[i].buffer);
    await pool.query('INSERT INTO product_images (product_id, url, position) VALUES ($1,$2,$3)', [
      product.id,
      result.secure_url,
      i
    ]);
  }

  res.status(201).json({ ok: true, id: product.id, slug: product.slug });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, subcategory, price, description, material, colours, sizes, in_stock, featured } = req.body;

  const { rows: existingRows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (existingRows.length === 0) return res.status(404).json({ error: 'Product not found' });
  const existing = existingRows[0];

  const slug = name && name !== existing.name ? await uniqueSlug(name, id) : existing.slug;

  await pool.query(
    `UPDATE products SET
      name = $1, slug = $2, category = $3, subcategory = $4, price = $5, description = $6,
      material = $7, colours = $8, sizes = $9, in_stock = $10, featured = $11, updated_at = now()
     WHERE id = $12`,
    [
      name ?? existing.name,
      slug,
      category ?? existing.category,
      subcategory !== undefined ? subcategory : existing.subcategory,
      price !== undefined ? Number(price) : existing.price,
      description ?? existing.description,
      material ?? existing.material,
      colours !== undefined ? parseListField(colours) : existing.colours,
      sizes !== undefined ? parseListField(sizes) : existing.sizes,
      in_stock !== undefined ? in_stock !== 'false' && in_stock !== false : existing.in_stock,
      featured !== undefined ? (featured === 'true' || featured === true) : existing.featured,
      id
    ]
  );

  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// add more photos to an existing product
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  const { id } = req.params;
  const { rows: existingImages } = await pool.query(
    'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
    [id]
  );
  let position = Number(existingImages[0].count);

  const files = req.files || [];
  const uploaded = [];
  for (const file of files) {
    const result = await uploadBuffer(file.buffer);
    const { rows } = await pool.query(
      'INSERT INTO product_images (product_id, url, position) VALUES ($1,$2,$3) RETURNING *',
      [id, result.secure_url, position]
    );
    uploaded.push(rows[0]);
    position += 1;
  }

  res.status(201).json({ ok: true, images: uploaded });
});

router.delete('/:id/images/:imageId', async (req, res) => {
  await pool.query('DELETE FROM product_images WHERE id = $1 AND product_id = $2', [
    req.params.imageId,
    req.params.id
  ]);
  res.json({ ok: true });
});

module.exports = router;
