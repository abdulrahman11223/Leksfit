const CART_KEY = 'leksfit_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

// each line: { slug, name, price, size, qty, image }
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((line) => line.slug === item.slug && line.size === item.size);

  if (existing) {
    existing.qty += item.qty || 1;
  } else {
    cart.push({ ...item, qty: item.qty || 1 });
  }

  saveCart(cart);
}

function removeFromCart(slug, size) {
  saveCart(getCart().filter((line) => !(line.slug === slug && line.size === size)));
}

function updateQty(slug, size, qty) {
  const cart = getCart();
  const line = cart.find((l) => l.slug === slug && l.size === size);
  if (line) {
    line.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function cartTotal(cart = getCart()) {
  return cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

function cartCount(cart = getCart()) {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
  badge.classList.remove('bump');
  // restart the animation each time the count changes
  void badge.offsetWidth;
  badge.classList.add('bump');
}

// small toast in the corner instead of a browser alert() — used for
// "added to cart", "pick a size first", etc.
let toastTimer;
function showToast(message) {
  let toast = document.getElementById('leksfitToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'leksfitToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function buildWhatsAppLink(cart = getCart()) {
  const lines = cart.map((line) => {
    const sizeText = line.size ? ` — Size ${line.size}` : '';
    const qtyText = line.qty > 1 ? ` x${line.qty}` : '';
    return `${line.name}${sizeText}${qtyText} — ₦${(line.price * line.qty).toLocaleString()}`;
  });

  const message = [
    'Hello LEKSFIT 👋',
    "I'd like to order:",
    '',
    ...lines,
    '',
    `Total: ₦${cartTotal(cart).toLocaleString()}`,
    '',
    'Please confirm availability.'
  ].join('\n');

  return `https://wa.me/2347064338069?text=${encodeURIComponent(message)}`;
}

updateCartBadge();
