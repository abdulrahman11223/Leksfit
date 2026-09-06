const productWrap = document.getElementById('productWrap');

if (productWrap) {
  const slug = new URLSearchParams(window.location.search).get('slug');
  loadProduct();

  async function loadProduct() {
    if (!slug) {
      productWrap.innerHTML = '<p class="empty-msg">No product specified.</p>';
      return;
    }

    const res = await fetch(`/api/products/${slug}`);
    if (!res.ok) {
      productWrap.innerHTML = '<p class="empty-msg">That piece isn\'t available anymore. <a href="shop.html">Back to shop →</a></p>';
      return;
    }

    const product = await res.json();
    document.title = `${product.name} — LEKSFIT Signature`;
    render(product);
  }

  function render(product) {
    const images = product.images.length ? product.images : ['favicon.png'];
    const colourText = (product.colours || []).join(', ');

    productWrap.innerHTML = `
      <div class="pdp-grid">
        <div>
          <div class="pdp-gallery-main"><img id="mainImg" src="${images[0]}" alt="${escapeHtml(product.name)}"></div>
          ${images.length > 1 ? `<div class="pdp-thumbs">${images.map((img, i) => `<img src="${img}" class="${i === 0 ? 'active' : ''}" data-src="${img}">`).join('')}</div>` : ''}
        </div>
        <div>
          <p class="pdp-tag">${escapeHtml(product.subcategory || (CATEGORIES[product.category] && CATEGORIES[product.category].label) || product.category)}</p>
          <h1 class="pdp-title">${escapeHtml(product.name)}</h1>
          <p class="pdp-price">₦${Number(product.price).toLocaleString()}</p>

          ${!product.in_stock ? '<p class="pdp-unavailable">Currently unavailable</p>' : ''}

          <p class="pdp-desc">${escapeHtml(product.description || '')}</p>
          ${product.material ? `<p class="pdp-meta"><strong>Material:</strong> ${escapeHtml(product.material)}</p>` : ''}
          ${colourText ? `<p class="pdp-meta"><strong>Colours:</strong> ${escapeHtml(colourText)}</p>` : ''}

          ${
            product.sizes && product.sizes.length
              ? `<div class="pdp-sizes" id="pdpSizes">${product.sizes.map((s) => `<button type="button" class="pdp-size-pill" data-size="${s}">${s}</button>`).join('')}</div>`
              : ''
          }

          <button class="btn btn-wa" id="pdpAddToCart" ${product.in_stock ? '' : 'disabled'}>
            ${product.in_stock ? 'Add to Cart' : 'Unavailable'}
          </button>
        </div>
      </div>`;

    const thumbs = productWrap.querySelectorAll('.pdp-thumbs img');
    const mainImg = document.getElementById('mainImg');
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        mainImg.src = thumb.dataset.src;
        thumbs.forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    let selectedSize = null;
    const sizePills = productWrap.querySelectorAll('.pdp-size-pill');
    sizePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        sizePills.forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedSize = pill.dataset.size;
      });
    });

    const addBtn = document.getElementById('pdpAddToCart');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (sizePills.length && !selectedSize) {
          showToast('Pick a size first');
          return;
        }
        addToCart({
          slug: product.slug,
          name: product.name,
          price: product.price,
          size: selectedSize,
          image: images[0]
        });
        addBtn.textContent = 'Added ✓';
        showToast(`${product.name}${selectedSize ? ` (${selectedSize})` : ''} added to cart`);
        setTimeout(() => (addBtn.textContent = 'Add to Cart'), 1200);
      });
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
