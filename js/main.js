/* ==============================================
   AKSHAY T — PORTFOLIO
   Main JavaScript
   ============================================== */

'use strict';

/* ---------- Navbar: scroll shadow ---------- */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.35)';
  } else {
    navbar.style.boxShadow = 'none';
  }
}, { passive: true });

/* ---------- Navbar: mobile toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Active nav link on scroll ---------- */
const sections = document.querySelectorAll('section[id], header[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

function updateActiveLink() {
  let current = '';
  sections.forEach(section => {
    const top = section.getBoundingClientRect().top;
    if (top <= 100) {
      current = section.id;
    }
  });

  navAnchors.forEach(a => {
    a.style.color = '';
    if (a.getAttribute('href') === '#' + current) {
      a.style.color = 'var(--clr-accent)';
    }
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });

/* ---------- Scroll reveal ---------- */
const revealElements = document.querySelectorAll(
  '.project-card, .skill-group, .cert-card, .timeline-item, .about-grid, .contact-item, .meta-card'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Slight stagger for sibling elements
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 60 * (i % 5));
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* ---------- Smooth scroll offset for fixed nav ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64);
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
