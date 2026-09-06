// Mobile nav toggle
const burger = document.getElementById('burgerBtn');
const nav = document.getElementById('mainNav');
if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.textContent = '☰';
    });
  });
}
// Shop filtering now lives in js/shop.js, since the grid loads from the API

// Highlight whichever nav link matches the current page
if (nav) {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}
