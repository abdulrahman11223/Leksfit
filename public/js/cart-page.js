const cartLinesEl = document.getElementById('cartLines');
const cartSummaryEl = document.getElementById('cartSummary');

if (cartLinesEl) {
  render();

  function render() {
    const cart = getCart();

    if (cart.length === 0) {
      cartLinesEl.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="shop.html" style="color:var(--rust);font-weight:600;">Browse the shop →</a></p>';
      cartSummaryEl.innerHTML = '';
      return;
    }

    cartLinesEl.innerHTML = cart
      .map(
        (line, i) => `
        <div class="cart-line">
          <img src="${line.image || 'favicon.png'}" alt="">
          <div class="cart-line-main">
            <div class="cart-line-info">
              <h4>${escapeHtml(line.name)}</h4>
              <div class="meta">${line.size ? `Size ${line.size} · ` : ''}₦${line.price.toLocaleString()} each</div>
            </div>
            <div class="cart-line-price">₦${(line.price * line.qty).toLocaleString()}</div>
          </div>
          <div class="cart-line-controls">
            <div class="cart-qty">
              <button class="qty-down" data-i="${i}">–</button>
              <span>${line.qty}</span>
              <button class="qty-up" data-i="${i}">+</button>
            </div>
            <button class="remove-line" data-i="${i}">Remove</button>
          </div>
        </div>`
      )
      .join('');

    cartSummaryEl.innerHTML = `
      <div class="cart-summary">
        <span class="cart-total">Total: ₦${cartTotal(cart).toLocaleString()}</span>
        <a class="btn btn-wa" id="checkoutBtn" target="_blank" rel="noopener" href="${buildWhatsAppLink(cart)}">Order on WhatsApp</a>
      </div>`;

    cartLinesEl.querySelectorAll('.remove-line').forEach((btn) =>
      btn.addEventListener('click', () => {
        const line = cart[btn.dataset.i];
        removeFromCart(line.slug, line.size);
        render();
      })
    );

    cartLinesEl.querySelectorAll('.qty-up').forEach((btn) =>
      btn.addEventListener('click', () => {
        const line = cart[btn.dataset.i];
        updateQty(line.slug, line.size, line.qty + 1);
        render();
      })
    );

    cartLinesEl.querySelectorAll('.qty-down').forEach((btn) =>
      btn.addEventListener('click', () => {
        const line = cart[btn.dataset.i];
        updateQty(line.slug, line.size, line.qty - 1);
        render();
      })
    );
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
