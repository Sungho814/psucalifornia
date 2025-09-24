// Smooth scroll to section when buttons or nav links are clicked
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

// Animate cards when they enter the viewport
function animateCards() {
  const cards = document.querySelectorAll('.card');
  const windowHeight = window.innerHeight;

  cards.forEach(card => {
    const cardTop = card.getBoundingClientRect().top;
    if (cardTop < windowHeight - 50) {
      card.classList.add('visible');
    }
  });
}

// Update footer year dynamically
function updateYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

// Initialize animations and footer on load
window.addEventListener('load', () => {
  animateCards();
  updateYear();
});

// Animate cards on scroll
window.addEventListener('scroll', animateCards);

// Optional: Smooth scroll for nav links
document.querySelectorAll('.main-nav a, .btn').forEach(link => {
  link.addEventListener('click', event => {
    const target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      event.preventDefault();
      scrollToSection(target.substring(1));
    }
  });
});