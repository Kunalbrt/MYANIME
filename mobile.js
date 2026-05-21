// ============================================================
//  mobile.js  â€”  Runs ONLY on mobile & tablet devices
//  Load this after app.js in index.html
// ============================================================

(function () {
  const isMobile = /Mobi|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent)
    || window.innerWidth <= 768;
  if (!isMobile) return; // â† desktop sees nothing from this file

  console.log('[mobile.js] Mobile mode active');

  // ============================================================
  //  1. HAMBURGER NAVBAR
  // ============================================================
  function initHamburger() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Create hamburger button
    const burger = document.createElement('button');
    burger.id = 'mobileBurger';
    burger.innerHTML = '&#9776;';
    burger.style.cssText = `
      background:none; border:none; color:#fff; font-size:1.6rem;
      cursor:pointer; padding:0.3rem 0.5rem; display:flex; align-items:center;
      order:3; margin-left:auto;
    `;

    // Create mobile menu drawer
    const drawer = document.createElement('div');
    drawer.id = 'mobileNavDrawer';
    drawer.style.cssText = `
      position:fixed; top:56px; left:0; right:0; z-index:999;
      background:#141414; border-bottom:1px solid #333;
      padding:1rem 1.5rem; display:none; flex-direction:column; gap:1rem;
      animation: slideDown 0.2s ease;
    `;
    drawer.innerHTML = `
      <style>
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      </style>
      <a class="mob-nav-link" onclick="showPage('home');closeMobileNav()">ðŸ  Home</a>
      <a class="mob-nav-link" onclick="showPage('search');closeMobileNav()">🔍 Search</a>
      <a class="mob-nav-link" onclick="showPage('mylist');closeMobileNav()">ðŸ“‹ My List</a>
      <a class="mob-nav-link" onclick="showPage('genres');closeMobileNav()">🎭 Genres</a>
      <hr style="border-color:#333;margin:0.2rem 0">
      <a class="mob-nav-link" onclick="openAdminLogin();closeMobileNav()">âš™ï¸ Admin</a>
    `;

    // Style nav links inside drawer
    const style = document.createElement('style');
    style.textContent = `
      .mob-nav-link {
        color:#ccc; font-size:1rem; font-weight:500; cursor:pointer;
        padding:0.4rem 0; border-bottom:1px solid #222; text-decoration:none;
        display:block;
      }
      .mob-nav-link:active { color:#fff; }
      #mobileBurger:active { opacity:0.7; }
    `;
    document.head.appendChild(style);

    // Hide desktop nav links on mobile
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.style.display = 'none';

    // Hide search bar on mobile (use search section instead)
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) searchBar.style.display = 'none';

    // Add burger to navbar right
    const navRight = document.querySelector('.nav-right');
    if (navRight) navRight.appendChild(burger);

    document.body.appendChild(drawer);

    burger.addEventListener('click', () => {
      const open = drawer.style.display === 'flex';
      drawer.style.display = open ? 'none' : 'flex';
      burger.innerHTML = open ? '&#9776;' : '&#10005;';
    });

    window.closeMobileNav = function () {
      drawer.style.display = 'none';
      burger.innerHTML = '&#9776;';
    };

    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && e.target !== burger) {
        closeMobileNav();
      }
    });
  }

  // ============================================================
  //  2. VIDEO PLAYER â€” open HLS in best available way
  // ============================================================
  function initMobilePlayer() {
    // Override openPlayer for mobile
    window._desktopOpenPlayer = window.openPlayer;

    window.openPlayer = function (anime, episodeUrl, episodeTitle) {
      if (!anime) return;

      const videoUrl = episodeUrl || anime.videoUrl || '';

      // If HLS stream â†’ show mobile player chooser
      if (videoUrl && videoUrl.includes('.m3u8')) {
        showMobilePlayerOptions(anime, videoUrl, episodeTitle);
        return;
      }

      // Fallback to desktop player for non-HLS
      if (window._desktopOpenPlayer) {
        window._desktopOpenPlayer(anime, episodeUrl, episodeTitle);
      }
    };
  }

  function showMobilePlayerOptions(anime, videoUrl, episodeTitle) {
    // Remove old sheet if exists
    const old = document.getElementById('mobilePlayerSheet');
    if (old) old.remove();

    const sheet = document.createElement('div');
    sheet.id = 'mobilePlayerSheet';
    sheet.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,0.85);
      display:flex; align-items:flex-end; justify-content:center;
    `;

    const title = episodeTitle ? `${anime.title} â€” ${episodeTitle}` : anime.title;

    sheet.innerHTML = `
      <div style="
        background:#1a1a1a; border-radius:16px 16px 0 0;
        padding:1.5rem; width:100%; max-width:480px;
        animation: sheetUp 0.25s ease;
      ">
        <style>
          @keyframes sheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
          .mob-player-btn {
            display:flex; align-items:center; gap:0.9rem;
            background:#252525; border:1px solid #333; border-radius:10px;
            padding:0.9rem 1.1rem; width:100%; margin-bottom:0.7rem;
            color:#fff; font-size:0.95rem; font-weight:500; cursor:pointer;
            text-align:left;
          }
          .mob-player-btn:active { background:#333; }
          .mob-player-icon { font-size:1.4rem; }
        </style>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem">
          <div>
            <div style="color:#fff;font-weight:700;font-size:1rem">${title}</div>
            <div style="color:#aaa;font-size:0.8rem;margin-top:0.2rem">Choose how to watch</div>
          </div>
          <button onclick="document.getElementById('mobilePlayerSheet').remove()"
            style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer">âœ•</button>
        </div>

        <button class="mob-player-btn" onclick="mobilePlayInApp('${videoUrl}', '${anime.title}')">
          <span class="mob-player-icon">▶¶ï¸</span>
          <div>
            <div>Play in App</div>
            <div style="color:#aaa;font-size:0.78rem">Uses built-in HLS player</div>
          </div>
        </button>

        <button class="mob-player-btn" onclick="mobileOpenExternal('${videoUrl}')">
          <span class="mob-player-icon">ðŸ“±</span>
          <div>
            <div>Open in External App</div>
            <div style="color:#aaa;font-size:0.78rem">VLC, MX Player, etc.</div>
          </div>
        </button>

        <button class="mob-player-btn" onclick="mobileCopyLink('${videoUrl}')">
          <span class="mob-player-icon">ðŸ”—</span>
          <div>
            <div>Copy Stream Link</div>
            <div style="color:#aaa;font-size:0.78rem">Paste in any player</div>
          </div>
        </button>
      </div>
    `;

    document.body.appendChild(sheet);

    // Close on backdrop tap
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) sheet.remove();
    });
  }

  window.mobilePlayInApp = function (videoUrl, title) {
    document.getElementById('mobilePlayerSheet')?.remove();
    // Open full screen HLS player overlay
    showMobileVideoOverlay(videoUrl, title);
  };

  window.mobileOpenExternal = function (videoUrl) {
    document.getElementById('mobilePlayerSheet')?.remove();
    window.open(videoUrl, '_blank');
  };

  window.mobileCopyLink = function (videoUrl) {
    navigator.clipboard?.writeText(videoUrl).then(() => {
      showMobileToast('Stream link copied! Paste in VLC or MX Player');
    }).catch(() => {
      prompt('Copy this link:', videoUrl);
    });
    document.getElementById('mobilePlayerSheet')?.remove();
  };

  // ============================================================
  //  3. FULL SCREEN MOBILE VIDEO OVERLAY
  // ============================================================
  function showMobileVideoOverlay(videoUrl, title) {
    const old = document.getElementById('mobileVideoOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mobileVideoOverlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:99999;
      background:#000; display:flex; flex-direction:column;
    `;

    overlay.innerHTML = `
      <div style="
        display:flex; align-items:center; gap:0.8rem;
        padding:0.8rem 1rem; background:#111;
      ">
        <button onclick="document.getElementById('mobileVideoOverlay').remove()"
          style="background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer">â†</button>
        <span style="color:#fff;font-size:0.9rem;font-weight:600;flex:1;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative">
        <video id="mobileHlsPlayer" controls playsinline
          style="width:100%;max-height:100%;background:#000">
        </video>
        <div id="mobilePlayerLoading" style="
          position:absolute;inset:0;display:flex;align-items:center;
          justify-content:center;background:rgba(0,0,0,0.6);
        ">
          <div style="color:#fff;font-size:0.9rem">Loading...</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Lock screen orientation to landscape if possible
    screen.orientation?.lock?.('landscape').catch(() => {});

    const video = document.getElementById('mobileHlsPlayer');
    const loading = document.getElementById('mobilePlayerLoading');

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loading.style.display = 'none';
      });
      hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          loading.innerHTML = '<div style="color:#e53935;font-size:0.9rem;text-align:center;padding:1rem">Failed to load stream.<br>Try External App instead.</div>';
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS Safari native HLS
      video.src = videoUrl;
      video.load();
      loading.style.display = 'none';
    } else {
      loading.innerHTML = '<div style="color:#e53935;font-size:0.9rem;text-align:center;padding:1rem">HLS not supported.<br>Try External App.</div>';
    }

    video.oncanplay = () => { loading.style.display = 'none'; };

    // Restore orientation on close
    overlay.querySelector('button').addEventListener('click', () => {
      screen.orientation?.unlock?.();
    });
  }

  // ============================================================
  //  4. TOUCH-FRIENDLY CARDS (tap to show buttons)
  // ============================================================
  function initTouchCards() {
    // On mobile, card hover doesn't work â€” use tap instead
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.anime-card');
      if (!card) {
        // Tap outside â€” close all open cards
        document.querySelectorAll('.anime-card.mob-active').forEach(c => {
          c.classList.remove('mob-active');
          const h = c.querySelector('.card-hover');
          if (h) h.style.opacity = '0';
        });
        return;
      }

      const hover = card.querySelector('.card-hover');
      if (!hover) return;

      // If tapping a button inside the card, let it fire
      if (e.target.closest('button') || e.target.closest('.card-play-btn')) return;

      const isOpen = card.classList.contains('mob-active');

      // Close all others
      document.querySelectorAll('.anime-card.mob-active').forEach(c => {
        c.classList.remove('mob-active');
        const h = c.querySelector('.card-hover');
        if (h) h.style.opacity = '0';
      });

      if (!isOpen) {
        card.classList.add('mob-active');
        hover.style.opacity = '1';
        hover.style.pointerEvents = 'all';
      }
    });

    // Add touch-specific card styles
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .anime-card { flex: 0 0 130px; min-width: 130px; height: 75px; }
        .card-thumb, .card-thumb-placeholder { height: 75px; }
        .anime-card:hover { transform: none; }
        .anime-card.mob-active { transform: scale(1.05); z-index: 100; }
        .card-hover { transition: opacity 0.2s ease !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  //  5. SWIPE SUPPORT FOR ANIME ROWS
  // ============================================================
  function initSwipeRows() {
    document.querySelectorAll('.anime-row').forEach(row => {
      let startX = 0;
      row.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      row.addEventListener('touchmove', (e) => {
        const diff = startX - e.touches[0].clientX;
        row.scrollLeft += diff * 0.8;
        startX = e.touches[0].clientX;
      }, { passive: true });
    });
  }

  // ============================================================
  //  6. EPISODE SIDEBAR â€” bottom drawer on mobile
  // ============================================================
  function initMobileEpisodeDrawer() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .player-body { flex-direction: column !important; }
        .episode-sidebar {
          width: 100% !important;
          border-left: none !important;
          border-top: 1px solid #333 !important;
          max-height: 220px !important;
          overflow-y: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  //  7. MOBILE TOAST NOTIFICATIONS
  // ============================================================
  window.mobilSearch = function(e) {
  window.mobilSearch = function(e) {
    const input = document.querySelector('#mobileSearchBar input');
    const q = input?.value.trim();
    if (!q) return;
    if (typeof trackSearch === 'function') trackSearch(q);
    const results = animeLibrary.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
    showPage('search');
    renderGrid('searchGrid', results);
  };
    const old = document.getElementById('mobileToast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'mobileToast';
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed; bottom:5rem; left:50%; transform:translateX(-50%);
      background:#333; color:#fff; padding:0.7rem 1.2rem; border-radius:8px;
      font-size:0.85rem; z-index:99999; white-space:nowrap;
      animation: fadeInUp 0.3s ease;
      max-width: 85vw; text-align:center; white-space:normal;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  };

  // ============================================================
  //  8. HERO BANNER â€” mobile layout fix
  // ============================================================
  function initMobileHero() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .hero { height: 65vh !important; min-height: 380px !important; }
        .hero-title { font-size: 2rem !important; }
        .hero-desc { font-size: 0.82rem !important; -webkit-line-clamp: 2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; }
        .hero-actions { gap: 0.6rem !important; }
        .btn-play, .btn-info { padding: 0.5rem 1rem !important; font-size: 0.85rem !important; }
        .hero-content { padding: 0 5% !important; }
      }
    `;
    document.head.appendChild(style);
  }

  
  // ============================================================
  //  9. MOBILE SEARCH BAR — below navbar on home screen
  // ============================================================
  function initMobileSearchBar() {
    const style = document.createElement('style');
    style.textContent = `
      #mobileSearchBar {
        position: fixed; top: 56px; left: 0; right: 0; z-index: 998;
        padding: 0.5rem 1rem;
        background: #141414;
        border-bottom: 1px solid #222;
        display: flex; align-items: center; gap: 0.5rem;
      }
      #mobileSearchBar input {
        flex: 1; background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 6px; padding: 0.5rem 0.8rem;
        color: #fff; font-size: 0.9rem; outline: none;
      }
      #mobileSearchBar input::placeholder { color: #888; }
      .hero { margin-top: 40px; }
      .rows-container { margin-top: 40px; }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.id = 'mobileSearchBar';
    bar.innerHTML = `
      <span>??</span>
      <input type="text" placeholder="Search anime..." 
        
        oninput="mobilSearch(event)" onkeyup="mobilSearch(event)" />
    `;
    document.body.appendChild(bar);
  }




  // ============================================================
  //  INIT ALL
  // ============================================================
  function init() {
    initHamburger();
    initMobilePlayer();
    initTouchCards();
    initSwipeRows();
    initMobileEpisodeDrawer();
    initMobileHero();
    initMobileSearchBar();
    console.log('[mobile.js] All mobile enhancements loaded âœ…');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();




