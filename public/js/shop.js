const sectionsWrap = document.getElementById('categorySections');

if (sectionsWrap) {
  const searchInput = document.getElementById('searchInput');
  const maxPriceInput = document.getElementById('maxPriceInput');

  const state = { search: '', maxPrice: '' };
  const sectionSubcat = {}; // category key -> selected subcategory, or 'all'
  const selectedSizes = {}; // slug -> size
  let allProducts = [];

  Object.keys(CATEGORIES).forEach((key) => (sectionSubcat[key] = 'all'));

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      loadProducts();
    }, 300);
  });

  maxPriceInput.addEventListener('change', () => {
    state.maxPrice = maxPriceInput.value;
    loadProducts();
  });

  async function loadProducts() {
    const params = new URLSearchParams();
    if (state.search) params.set('search', state.search);
    if (state.maxPrice) params.set('maxPrice', state.maxPrice);

    sectionsWrap.innerHTML = '<p class="loading-msg">Loading pieces…</p>';

    allProducts = await fetch(`/api/products?${params.toString()}`).then((r) => r.json());
    renderSections();
  }

  function renderSections() {
    sectionsWrap.innerHTML = Object.entries(CATEGORIES)
      .map(([key, def]) => sectionHtml(key, def))
      .join('');

    Object.keys(CATEGORIES).forEach((key) => wireSection(key));
  }

  function sectionHtml(key, def) {
    const inCategory = allProducts.filter((p) => p.category === key);
    const activeSubcat = sectionSubcat[key];
    const visible = inCategory.filter((p) => activeSubcat === 'all' || p.subcategory === activeSubcat);

    const pills = ['all', ...def.subcategories]
      .map((sub) => {
        const label = sub === 'all' ? 'All' : sub;
        const active = sub === activeSubcat ? ' active' : '';
        return `<button type="button" class="subcat-pill${active}" data-category="${key}" data-subcat="${sub}">${label}</button>`;
      })
      .join('');

    let body;
    if (inCategory.length === 0) {
      body = `<p class="category-empty">No pieces listed here yet — check back soon.</p>`;
    } else if (visible.length === 0) {
      body = `<p class="category-empty">Nothing in "${escapeHtml(activeSubcat)}" right now — try another filter above.</p>`;
    } else {
      body = `<div class="grid-3">${visible.map(cardHtml).join('')}</div>`;
    }

    return `
      <div class="category-section" data-section="${key}">
        <div class="category-section-head">
          <h2><em>${escapeHtml(def.label)}</em></h2>
          <div class="subcat-pills">${pills}</div>
        </div>
        ${body}
      </div>`;
  }

  function cardHtml(p) {
    const img = p.images[0] || 'favicon.png';
    const sizePills = (p.sizes || [])
      .map((s) => `<button type="button" class="size-pill" data-slug="${p.slug}" data-size="${s}">${s}</button>`)
      .join('');

    return `
      <div class="card">
        <a href="product.html?slug=${p.slug}" class="card-img"><img loading="lazy" src="${img}" alt="${escapeHtml(p.name)}"></a>
        <div class="card-body">
          <span class="card-tag">${escapeHtml(p.subcategory || CATEGORIES[p.category].label)}</span>
          <a href="product.html?slug=${p.slug}" style="text-decoration:none;color:inherit;">
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
          </a>
          <p class="card-desc">${escapeHtml(p.description || '')}</p>
          <p class="card-price">₦${Number(p.price).toLocaleString()}</p>
          ${sizePills ? `<div class="size-pill-row" data-product="${p.slug}">${sizePills}</div>` : ''}
        </div>
        <div class="card-foot">
          <button class="btn btn-wa add-to-cart-btn" data-slug="${p.slug}">Add to Cart</button>
        </div>
      </div>`;
  }

  function wireSection(key) {
    const section = sectionsWrap.querySelector(`[data-section="${key}"]`);
    if (!section) return;

    section.querySelectorAll('.subcat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        sectionSubcat[key] = pill.dataset.subcat;
        renderSections();
      });
    });

    section.querySelectorAll('.size-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const row = pill.parentElement;
        row.querySelectorAll('.size-pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedSizes[pill.dataset.slug] = pill.dataset.size;
      });
    });

    section.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        const product = allProducts.find((p) => p.slug === slug);
        const hasSizes = (product.sizes || []).length > 0;

        if (hasSizes && !selectedSizes[slug]) {
          showToast('Pick a size first');
          return;
        }

        addToCart({
          slug: product.slug,
          name: product.name,
          price: product.price,
          size: selectedSizes[slug] || null,
          image: product.images[0] || ''
        });

        btn.textContent = 'Added ✓';
        showToast(`${product.name}${selectedSizes[slug] ? ` (${selectedSizes[slug]})` : ''} added to cart`);
        setTimeout(() => (btn.textContent = 'Add to Cart'), 1200);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadProducts();
}
