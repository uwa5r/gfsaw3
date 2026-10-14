/**
 * GRYHTML - Main UI: nav, mobile menu, search, scroll reveal, shared init
 */
(function () {
  'use strict';

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const toggle = qs('[data-menu-toggle]');
    const menu = qs('[data-mobile-menu]');
    const overlay = qs('[data-menu-overlay]');
    if (!toggle || !menu) return;

    function open() {
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      if (overlay) overlay.classList.add('is-visible');
    }
    function close() {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (overlay) overlay.classList.remove('is-visible');
    }

    toggle.addEventListener('click', () => {
      menu.classList.contains('is-open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
    qsa('[data-mobile-menu] a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- Search form ---------- */
  function initSearch() {
    qsa('[data-search-form]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = form.querySelector('input[name="q"], input[type="search"]');
        const q = (input && input.value || '').trim();
        if (q) {
          window.location.href = `szukaj.html?q=${encodeURIComponent(q)}`;
        }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      qsa('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const els = qsa('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Active nav link ---------- */
  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    qsa('[data-nav] a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const page = href.split('/').pop().split('?')[0];
      if (page === path || (path === '' && page === 'index.html')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Favorites badge update ---------- */
  function updateFavBadge() {
    const count = GRYHTML_FAV.getFavorites().length;
    qsa('[data-fav-count]').forEach(el => {
      el.textContent = count > 0 ? String(count) : '';
      el.hidden = count === 0;
    });
  }

  document.addEventListener('gryhtml:favorites-changed', updateFavBadge);

  /* ---------- Smooth anchor scroll ---------- */
  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initMobileMenu();
    initSearch();
    initScrollReveal();
    setActiveNav();
    updateFavBadge();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.GRYHTML_MAIN = { updateFavBadge };
})(typeof window !== 'undefined' ? window : globalThis);
