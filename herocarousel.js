// ============================================================
//  hero-carousel.js  — Swipeable hero banner carousel
//  Add after app.js in index.html
// ============================================================
(function () {

  let current   = 0;
  let items     = [];
  let autoTimer = null;

  // ── Grab elements ──────────────────────────────────────────
  const section = document.getElementById('heroSection');
  const bg      = document.getElementById('heroBg');
  const title   = document.getElementById('heroTitle');
  const desc    = document.getElementById('heroDesc');
  const year    = document.getElementById('heroYear');

  // ── Build dot indicators ───────────────────────────────────
  function buildDots() {
    const old = document.getElementById('heroDots');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'heroDots';
    wrap.className = 'hero-dots';
    items.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'hero-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      wrap.appendChild(d);
    });
    section.appendChild(wrap);
  }

  // ── Update hero content ────────────────────────────────────
  function updateHero(item) {
    // Fade out
    bg.style.opacity = '0';
    setTimeout(() => {
      if (item.thumb && (item.thumb.startsWith('data:') || item.thumb.startsWith('http'))) {
        bg.style.background = `url(${item.thumb}) center/cover no-repeat`;
      } else {
        const gradients = [
          'linear-gradient(135deg,#1a0a0a,#0d1a2e)',
          'linear-gradient(135deg,#0a0a1a,#1a2e0d)',
          'linear-gradient(135deg,#1a0a0a,#2e0d1a)',
          'linear-gradient(135deg,#0d2e1a,#1a0a2e)',
          'linear-gradient(135deg,#2e1a0a,#0a1a2e)',
        ];
        const idx = (item.id || '').charCodeAt(1) % gradients.length;
        bg.style.background = gradients[idx >= 0 ? idx : 0];
      }
      if (title) title.textContent = item.title || '';
      if (desc)  desc.textContent  = item.desc  || 'An epic anime adventure awaits.';
      if (year)  year.textContent  = item.year  || '';
      bg.style.opacity = '1';
    }, 280);

    // Update dots
    document.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  // ── Navigate to slide ──────────────────────────────────────
  function goTo(index) {
    current = ((index % items.length) + items.length) % items.length;
    updateHero(items[current]);
    resetAuto();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // ── Auto-rotate every 5 s ──────────────────────────────────
  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 5000);
  }

  // ── Touch / swipe ──────────────────────────────────────────
  let txStart = 0, tyStart = 0;
  section.addEventListener('touchstart', e => {
    txStart = e.touches[0].clientX;
    tyStart = e.touches[0].clientY;
  }, { passive: true });

  section.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - txStart;
    const dy = e.changedTouches[0].clientY - tyStart;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  // ── Mouse drag (desktop) ───────────────────────────────────
  let mxStart = 0, dragging = false;
  section.addEventListener('mousedown', e => { mxStart = e.clientX; dragging = true; });
  section.addEventListener('mouseup',   e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - mxStart;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  });
  section.addEventListener('mouseleave', () => { dragging = false; });

  // ── Wait for animeLibrary then init ───────────────────────
  function init() {
    const lib = window.animeLibrary || [];
    // Pick trending + topRated items with valid thumb, max 6
    items = lib.filter(a => (a.trending || a.topRated) && a.thumb &&
      (a.thumb.startsWith('data:') || a.thumb.startsWith('http')));
    // Fallback: any items with thumb
    if (items.length < 2) {
      items = lib.filter(a => a.thumb &&
        (a.thumb.startsWith('data:') || a.thumb.startsWith('http')));
    }
    // Fallback: all items
    if (items.length < 2) items = lib;
    items = items.slice(0, 6);

    if (items.length < 2) return; // no carousel needed
    buildDots();
    resetAuto();
  }

  function waitForLib(attempts) {
    if ((window.animeLibrary || []).length > 0) {
      init();
    } else if (attempts < 30) {
      setTimeout(() => waitForLib(attempts + 1), 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForLib(0));
  } else {
    waitForLib(0);
  }

})();