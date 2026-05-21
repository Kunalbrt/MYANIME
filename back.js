// ============================================================
//  back.js  —  Mobile back button
//  Loads after mobile.js
// ============================================================

(function () {
  const isMobile = /Mobi|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent)
    || window.innerWidth <= 768;
  // if (!isMobile) return; // TEMP DISABLED FOR DEBUG

  const pageHistory = ['home'];

  // Create back button
  const btn = document.createElement('button');
  btn.id = 'mobileBackBtn';
  btn.innerHTML = '&#8592;';
  btn.style.cssText = `
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 2000;
    background: rgba(0,0,0,0.7);
    border: none;
    color: #fff;
    font-size: 1.6rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: opacity 0.2s;
  `;
  document.body.appendChild(btn);

  // Show/hide based on current page
  function updateBtn() {
    const active = document.querySelector('.page.active');
    console.log("[back.js] active page:", active?.id); const isHome = !active || active.id === 'homePage';
    btn.style.display = isHome ? 'none' : 'flex';
  }

  // Override showPage once it's available
  function hookShowPage() {
    if (typeof window.showPage !== 'function') {
      setTimeout(hookShowPage, 100);
      return;
    }
    const _orig = window.showPage;
    window.showPage = function (page) {
      const current = pageHistory[pageHistory.length - 1];
      if (page !== current) pageHistory.push(page);
      _orig(page);
      setTimeout(updateBtn, 50);
    };
  }

  // Back button click
  btn.addEventListener('click', () => {
    if (pageHistory.length > 1) {
      pageHistory.pop();
      const prev = pageHistory[pageHistory.length - 1];
      if (typeof window.showPage === 'function') {
        // Call original to avoid double-pushing history
        const _orig = window.showPage;
        window.showPage = function(p) { _orig(p); setTimeout(updateBtn, 50); };
        window.showPage(prev);
      }
    }
    setTimeout(updateBtn, 50);
  });

  // Also handle player close — go back when player closes
  const playerOverlay = document.getElementById('playerOverlay');
  if (playerOverlay) {
    const observer = new MutationObserver(() => {
      setTimeout(updateBtn, 100);
    });
    observer.observe(playerOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  // Initial check
  document.addEventListener('DOMContentLoaded', () => {
    hookShowPage();
    setTimeout(updateBtn, 500);
  });

  if (document.readyState !== 'loading') {
    hookShowPage();
    setTimeout(updateBtn, 500);
  }

})();

