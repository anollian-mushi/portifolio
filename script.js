// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

links.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// Dark / light mode (remembers the choice if storage is available)
const root = document.documentElement;
const themeBtn = document.querySelector('.theme-toggle');

try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch (_) {}

themeBtn.addEventListener('click', () => {
  const current =
    root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (_) {}
});
