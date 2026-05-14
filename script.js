/**
 * Enkorp – Precious Metals Website
 * Interactive JavaScript Module
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// Utility helpers
// ═══════════════════════════════════════════════════════════════

/** Returns an element by selector, scoped to a root (default: document) */
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Clamp a number between min and max */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Easing: ease out cubic */
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// ═══════════════════════════════════════════════════════════════
// 1. Navbar – scroll behaviour + active link
// ═══════════════════════════════════════════════════════════════

function initNavbar() {
  const navbar    = qs('#navbar');
  const navLinks  = qsa('.nav-link');
  const sections  = qsa('section[id]');

  if (!navbar) return;

  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Solid background when scrolled past 60px
    navbar.classList.toggle('scrolled', scrollY > 60);

    // Active section highlight
    let currentId = '';
    sections.forEach(section => {
      const top    = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${currentId}`);
    });

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

// ═══════════════════════════════════════════════════════════════
// 2. Mobile Hamburger Menu
// ═══════════════════════════════════════════════════════════════

function initHamburger() {
  const hamburger = qs('#hamburger');
  const navMenu   = qs('#navMenu');

  if (!hamburger || !navMenu) return;

  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : !navMenu.classList.contains('open');
    hamburger.classList.toggle('active', isOpen);
    navMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());

  // Close when a link is clicked
  qsa('.nav-link', navMenu).forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on overlay click (outside nav)
  document.addEventListener('click', e => {
    if (
      navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMenu(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      toggleMenu(false);
      hamburger.focus();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. Smooth Scroll for nav links (polyfill-safe)
// ═══════════════════════════════════════════════════════════════

function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = qs(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = qs('#navbar')?.offsetHeight ?? 80;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. Scroll-triggered fade-in (IntersectionObserver)
// ═══════════════════════════════════════════════════════════════

function initRevealAnimations() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    qsa('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger siblings slightly
          const siblings = qsa('.reveal', entry.target.closest('.services-grid, .products-grid, .testimonials-grid, .stats-grid, .values-grid') || document);
          const siblingsArr = siblings.filter(s => !s.classList.contains('visible'));
          const delay = siblingsArr.indexOf(entry.target);

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay >= 0 ? delay * 80 : 0);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  qsa('.reveal').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// 5. Counter Animation for Stats
// ═══════════════════════════════════════════════════════════════

function initCounters() {
  const counters = qsa('[data-target]');
  if (!counters.length) return;

  const formatNumber = n => {
    if (n >= 1000) return n.toLocaleString('es-PE');
    return String(n);
  };

  function animateCounter(el) {
    const target  = parseInt(el.dataset.target, 10);
    const suffix  = el.dataset.suffix ?? '';
    const duration = 1800; // ms
    let start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      const progress  = Math.min((timestamp - start) / duration, 1);
      const easedProg = easeOutCubic(progress);
      const current   = Math.round(lerp(0, target, easedProg));

      el.textContent = formatNumber(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// 6. Hero Particle System
// ═══════════════════════════════════════════════════════════════

function initParticles() {
  const container = qs('#heroParticles');
  if (!container) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PARTICLE_COUNT = 40;

  function createParticle() {
    const p = document.createElement('span');
    p.className = 'particle';

    const size   = Math.random() * 3 + 1;
    const startX = Math.random() * 100;
    const delay  = Math.random() * 8;
    const dur    = Math.random() * 12 + 8;
    const drift  = (Math.random() - 0.5) * 60; // horizontal drift

    p.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      left:   ${startX}%;
      bottom: -10px;
      animation-duration:  ${dur}s;
      animation-delay:     ${delay}s;
      --drift:             ${drift}px;
    `;

    container.appendChild(p);

    // Remove & recreate after animation to avoid DOM bloat
    p.addEventListener('animationend', () => {
      p.remove();
      createParticle();
    }, { once: true });
  }

  // Spawn initial batch
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createParticle();
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. Contact Form Validation
// ═══════════════════════════════════════════════════════════════

function initContactForm() {
  const form     = qs('#contactForm');
  if (!form) return;

  const submitBtn  = qs('#formSubmit',  form);
  const successMsg = qs('#formSuccess', form);

  const fields = {
    nombre:  { el: qs('#nombre',  form), errEl: qs('#nombreError',  form), validate: v => v.trim().length >= 2 ? '' : 'Por favor ingresa tu nombre completo.' },
    email:   { el: qs('#email',   form), errEl: qs('#emailError',   form), validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Ingresa un correo electrónico válido.' },
    mensaje: { el: qs('#mensaje', form), errEl: qs('#mensajeError', form), validate: v => v.trim().length >= 10 ? '' : 'El mensaje debe tener al menos 10 caracteres.' },
  };

  function showError(field, msg) {
    field.el.classList.toggle('error',   !!msg);
    field.el.classList.toggle('success', !msg && field.el.value.trim() !== '');
    field.errEl.textContent = msg;
  }

  // Live validation on blur
  Object.values(fields).forEach(field => {
    field.el.addEventListener('blur', () => {
      const err = field.validate(field.el.value);
      showError(field, err);
    });

    // Clear error on input
    field.el.addEventListener('input', () => {
      if (field.el.classList.contains('error')) {
        const err = field.validate(field.el.value);
        showError(field, err);
      }
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Validate all fields
    let valid = true;
    Object.values(fields).forEach(field => {
      const err = field.validate(field.el.value);
      showError(field, err);
      if (err) valid = false;
    });

    if (!valid) {
      // Focus first error field
      const firstErrorField = Object.values(fields).find(f => f.el.classList.contains('error'));
      firstErrorField?.el.focus();
      return;
    }

    // Simulate async submission
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Enviando…';

    setTimeout(() => {
      // Reset form
      form.reset();
      Object.values(fields).forEach(field => {
        field.el.classList.remove('success', 'error');
        field.errEl.textContent = '';
      });

      // Show success
      successMsg.hidden = false;
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Enviar Mensaje';

      // Hide success after 6s
      setTimeout(() => {
        successMsg.hidden = true;
      }, 6000);
    }, 1200);
  });
}

// ═══════════════════════════════════════════════════════════════
// 8. Back-to-Top Button
// ═══════════════════════════════════════════════════════════════

function initBackToTop() {
  const btn = qs('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ═══════════════════════════════════════════════════════════════
// 9. Footer Year
// ═══════════════════════════════════════════════════════════════

function initFooterYear() {
  const el = qs('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ═══════════════════════════════════════════════════════════════
// 10. Navbar overlay for mobile (dim background)
// ═══════════════════════════════════════════════════════════════

function initMobileOverlay() {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 998;
    background: rgba(0,0,0,.6);
    opacity: 0; pointer-events: none;
    transition: opacity .35s;
  `;
  document.body.appendChild(overlay);

  const navMenu = qs('#navMenu');
  if (!navMenu) return;

  // Watch class mutations on navMenu
  const mo = new MutationObserver(() => {
    const isOpen = navMenu.classList.contains('open');
    overlay.style.opacity        = isOpen ? '1' : '0';
    overlay.style.pointerEvents  = isOpen ? 'auto' : 'none';
  });
  mo.observe(navMenu, { attributes: true, attributeFilter: ['class'] });

  overlay.addEventListener('click', () => {
    navMenu.classList.remove('open');
    qs('#hamburger')?.classList.remove('active');
    qs('#hamburger')?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
}

// ═══════════════════════════════════════════════════════════════
// 11. Product card tilt effect (desktop only)
// ═══════════════════════════════════════════════════════════════

function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices

  const cards = qsa('.product-card, .service-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX = clamp(y * -10, -6, 6);
      const tiltY = clamp(x *  10, -6, 6);

      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 12. Testimonial auto-scroll indicator (visual pulse)
// ═══════════════════════════════════════════════════════════════

function initTestimonialGlow() {
  const featured = qs('.testimonial-card--featured');
  if (!featured || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Subtle pulse on the featured card border
  let bright = false;
  setInterval(() => {
    bright = !bright;
    featured.style.boxShadow = bright
      ? '0 0 40px rgba(201,168,76,.15), 0 8px 40px rgba(0,0,0,.45)'
      : 'none';
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// 13. Nav link scroll spy refinement (requestAnimationFrame loop)
// ═══════════════════════════════════════════════════════════════
// (Handled inside initNavbar via scroll event — no extra loop needed)

// ═══════════════════════════════════════════════════════════════
// INIT – Wait for DOM ready
// ═══════════════════════════════════════════════════════════════

function init() {
  initFooterYear();
  initNavbar();
  initHamburger();
  initMobileOverlay();
  initSmoothScroll();
  initRevealAnimations();
  initCounters();
  initParticles();
  initContactForm();
  initBackToTop();
  initCardTilt();
  initTestimonialGlow();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
