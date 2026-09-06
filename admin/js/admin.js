const API = '/api/admin';

// ---------- login page ----------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      window.location.href = '/admin/';
    } else {
      const data = await res.json().catch(() => ({}));
      errorMsg.textContent = data.error || 'Could not log in';
    }
  });
}

// ---------- dashboard page ----------
const productTableWrap = document.getElementById('productTableWrap');
if (productTableWrap) {
  initDashboard();
}

async function initDashboard() {
  // bounce to login if session isn't active
  const me = await fetch(`${API}/me`).then((r) => r.json());
  if (!me.loggedIn) {
    window.location.href = '/admin/login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch(`${API}/logout`, { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  document.getElementById('addBtn').addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('productForm').addEventListener('submit', saveProduct);

  document.getElementById('passwordBtn').addEventListener('click', openPasswordModal);
  document.getElementById('pwModalClose').addEventListener('click', closePasswordModal);
  document.getElementById('pwCancelBtn').addEventListener('click', closePasswordModal);
  document.getElementById('passwordForm').addEventListener('submit', changePassword);

  document.getElementById('f_category').addEventListener('change', (e) => populateSubcategories(e.target.value));

  loadProducts();
}

function openPasswordModal() {
  document.getElementById('passwordForm').reset();
  document.getElementById('pwError').textContent = '';
  document.getElementById('pwSuccess').textContent = '';
  document.getElementById('pwModalBackdrop').classList.add('open');
}

function closePasswordModal() {
  document.getElementById('pwModalBackdrop').classList.remove('open');
}

async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('pw_current').value;
  const newPassword = document.getElementById('pw_new').value;
  const confirmPassword = document.getElementById('pw_confirm').value;
  const errorEl = document.getElementById('pwError');
  const successEl = document.getElementById('pwSuccess');

  errorEl.textContent = '';
  successEl.textContent = '';

  if (newPassword !== confirmPassword) {
    errorEl.textContent = "New passwords don't match";
    return;
  }

  const res = await fetch(`${API}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (res.ok) {
    successEl.textContent = 'Password updated.';
    document.getElementById('passwordForm').reset();
    setTimeout(closePasswordModal, 1200);
  } else {
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Could not update password';
  }
}

let currentEditImages = []; // images already saved on the product being edited

async function loadProducts() {
  const products = await fetch(`${API}/products`).then((r) => r.json());
  renderTable(products);
}

function renderTable(products) {
  const wrap = document.getElementById('productTableWrap');

  if (products.length === 0) {
    wrap.innerHTML = '<p class="loading">No products yet — add your first piece.</p>';
    return;
  }

  const rows = products
    .map((p) => {
      const thumb = p.images[0] ? `<img src="${p.images[0].url}" alt="">` : '';
      const status = p.in_stock
        ? '<span class="tag tag-live">Available</span>'
        : '<span class="tag tag-off">Unavailable</span>';
      return `
        <tr data-id="${p.id}">
          <td>${thumb}</td>
          <td>${escapeHtml(p.name)}${p.featured ? ' ★' : ''}</td>
          <td>${escapeHtml((CATEGORIES[p.category] && CATEGORIES[p.category].label) || p.category)}${p.subcategory ? ` — ${escapeHtml(p.subcategory)}` : ''}</td>
          <td>₦${Number(p.price).toLocaleString()}</td>
          <td>${status}</td>
          <td class="row-actions">
            <button class="edit-btn">Edit</button>
            <button class="danger delete-btn">Delete</button>
          </td>
        </tr>`;
    })
    .join('');

  wrap.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  wrap.querySelectorAll('.edit-btn').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('tr').dataset.id;
      const product = products.find((p) => p.id == id);
      openModal(product);
    })
  );

  wrap.querySelectorAll('.delete-btn').forEach((btn) =>
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      if (!confirm('Delete this product? This cannot be undone.')) return;
      await fetch(`${API}/products/${id}`, { method: 'DELETE' });
      loadProducts();
    })
  );
}

function openModal(product) {
  document.getElementById('modalTitle').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('productForm').reset();
  document.getElementById('formError').textContent = '';
  document.getElementById('productId').value = product ? product.id : '';

  currentEditImages = product ? product.images : [];
  renderExistingImages();

  const category = product ? product.category : 'clothing';
  document.getElementById('f_category').value = category;
  populateSubcategories(category, product ? product.subcategory : null);

  if (product) {
    document.getElementById('f_name').value = product.name;
    document.getElementById('f_price').value = product.price;
    document.getElementById('f_description').value = product.description || '';
    document.getElementById('f_material').value = product.material || '';
    document.getElementById('f_colours').value = (product.colours || []).join(', ');
    document.getElementById('f_in_stock').checked = product.in_stock;
    document.getElementById('f_featured').checked = product.featured;

    document.querySelectorAll('#sizeChecks input').forEach((cb) => {
      cb.checked = (product.sizes || []).includes(cb.value);
    });
  }

  document.getElementById('modalBackdrop').classList.add('open');
}

// fills the subcategory dropdown based on whichever main category is picked
function populateSubcategories(categoryKey, selected) {
  const select = document.getElementById('f_subcategory');
  const subs = (CATEGORIES[categoryKey] && CATEGORIES[categoryKey].subcategories) || [];
  select.innerHTML = subs.map((s) => `<option value="${s}">${s}</option>`).join('');
  if (selected && subs.includes(selected)) select.value = selected;
}

function renderExistingImages() {
  const wrap = document.getElementById('existingImages');
  const productId = document.getElementById('productId').value;

  if (!productId || currentEditImages.length === 0) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = currentEditImages
    .map(
      (img) => `
      <div class="thumb" data-img-id="${img.id}">
        <img src="${img.url}" alt="">
        <button type="button" class="del-img">&times;</button>
      </div>`
    )
    .join('');

  wrap.querySelectorAll('.del-img').forEach((btn) =>
    btn.addEventListener('click', async (e) => {
      const thumb = e.target.closest('.thumb');
      const imgId = thumb.dataset.imgId;
      await fetch(`${API}/products/${productId}/images/${imgId}`, { method: 'DELETE' });
      currentEditImages = currentEditImages.filter((img) => img.id != imgId);
      renderExistingImages();
    })
  );
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const saveBtn = document.getElementById('saveBtn');
  const formError = document.getElementById('formError');

  const sizes = [...document.querySelectorAll('#sizeChecks input:checked')].map((cb) => cb.value);

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  formError.textContent = '';

  try {
    if (id) {
      // text fields only — new photos go through a separate request below
      const res = await fetch(`${API}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsAsObject(sizes))
      });
      if (!res.ok) throw new Error((await res.json()).error);

      const files = document.getElementById('f_images').files;
      if (files.length > 0) {
        await uploadImages(id, files);
      }
    } else {
      const formData = fieldsAsFormData(sizes);
      const files = document.getElementById('f_images').files;
      for (const file of files) formData.append('images', file);

      const res = await fetch(`${API}/products`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    closeModal();
    loadProducts();
  } catch (err) {
    formError.textContent = err.message || 'Something went wrong — try again.';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save product';
  }
}

async function uploadImages(productId, files) {
  const formData = new FormData();
  for (const file of files) formData.append('images', file);
  await fetch(`${API}/products/${productId}/images`, { method: 'POST', body: formData });
}

function fieldsAsObject(sizes) {
  return {
    name: document.getElementById('f_name').value,
    category: document.getElementById('f_category').value,
    subcategory: document.getElementById('f_subcategory').value,
    price: document.getElementById('f_price').value,
    description: document.getElementById('f_description').value,
    material: document.getElementById('f_material').value,
    colours: document.getElementById('f_colours').value,
    sizes: sizes.join(','),
    in_stock: document.getElementById('f_in_stock').checked,
    featured: document.getElementById('f_featured').checked
  };
}

function fieldsAsFormData(sizes) {
  const fd = new FormData();
  const obj = fieldsAsObject(sizes);
  Object.entries(obj).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
