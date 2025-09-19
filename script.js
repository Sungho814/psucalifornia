// Header scroll style
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});

// Smooth scroll
function scrollToSection(id){
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.querySelectorAll('a[href^="#"], button[onclick^="scrollToSection"]').forEach(el => {
  el.addEventListener('click', e => {
    const href = el.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      scrollToSection(href.slice(1));
    }
  });
});

// Animate cards on scroll
const cards = document.querySelectorAll('.card');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.18 });
cards.forEach(c => observer.observe(c));

// Footer year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.querySelector('#year');
  if (y) y.textContent = new Date().getFullYear();
});