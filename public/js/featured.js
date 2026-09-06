const featuredGrid = document.getElementById('featuredGrid');

if (featuredGrid) {
  loadFeatured();
}

async function loadFeatured() {
  const products = await fetch('/api/products?featured=true').then((r) => r.json());

  if (products.length === 0) {
    featuredGrid.innerHTML = '<p class="loading-msg">New pieces coming soon — check the shop.</p>';
    return;
  }

  featuredGrid.innerHTML = products
    .slice(0, 3)
    .map((p) => {
      const img = p.images[0] || 'favicon.png';
      return `
        <div class="card">
          <a href="product.html?slug=${p.slug}" class="card-img"><img loading="lazy" src="${img}" alt="${escapeHtml(p.name)}"></a>
          <div class="card-body">
            <span class="card-tag">${escapeHtml(p.subcategory || (CATEGORIES[p.category] && CATEGORIES[p.category].label) || p.category)}</span>
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
          </div>
          <div class="card-foot">
            <a class="btn btn-wa" href="product.html?slug=${p.slug}">View piece</a>
          </div>
        </div>`;
    })
    .join('');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
