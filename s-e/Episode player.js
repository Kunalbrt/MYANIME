

const API_BASE = 'https://myanime-backend-2vc9.onrender.com/api';

// ── STATE ────────────────────────────────────────────────────
let state = {
  animeId:        null,
  animeData:      null,          // full anime object from API
  currentSeason:  0,
  currentEpIndex: 0,
  allEpisodes:    [],            // flat list for current season
  filteredEps:    [],
  rangeSize:      100,
  currentRange:   0,
};

// ── DOM REFS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  epList:        $('epList'),
  epSearch:      $('epSearch'),
  epRangeSelect: $('epRangeSelect'),
  seasonTabs:    $('seasonTabs'),
  videoIframe:   $('videoIframe'),
  videoPlaceholder: $('videoPlaceholder'),
  epTitle:       $('epTitle'),
  epDesc:        $('epDesc'),
  epNumberBadge: $('epNumberBadge'),
  prevBtn:       $('prevBtn'),
  nextBtn:       $('nextBtn'),
  epSidebar:     $('epSidebar'),
  sidebarToggle: $('sidebarToggle'),
  sidebarExpand: $('sidebarExpand'),
  bcAnimeTitle:  $('bc-anime-title'),
  bcEpLabel:     $('bc-ep-label'),
};

// ── INIT ─────────────────────────────────────────────────────
async function init() {
  const params = new URLSearchParams(window.location.search);
  state.animeId = params.get('id');

  // --- DEMO MODE: no ID → inject dummy data so the UI is previewable
  if (!state.animeId) {
    loadDemoData();
    return;
  }

  // Fetch real anime from backend
  try {
    const res  = await fetch(`${API_BASE}/anime/${state.animeId}`);
    const json = await res.json();
    state.animeData = json.anime || json;
    hydrate();
  } catch (e) {
    console.error('Failed to load anime:', e);
    showError('Could not load episode data. Please check your connection.');
  }
}

// ── HYDRATE UI FROM animeData ────────────────────────────────
function hydrate() {
  const anime = state.animeData;
  if (!anime) return;

  // Breadcrumb
  els.bcAnimeTitle.textContent = anime.title || 'Anime';

  // Build season tabs
  const seasons = anime.seasons || [];

  if (seasons.length > 1) {
    els.seasonTabs.innerHTML = '';
    seasons.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'season-tab' + (i === 0 ? ' active' : '');
      btn.textContent = s.title || `Season ${s.seasonNumber || i + 1}`;
      btn.dataset.season = i;
      btn.onclick = () => selectSeason(i);
      els.seasonTabs.appendChild(btn);
    });
  }

  // Load first season
  if (seasons.length > 0) {
    loadSeason(0);
  } else {
    // Movie or single video — no episodes
    showError('This title has no episode list.');
  }
}

// ── SELECT SEASON ────────────────────────────────────────────
function selectSeason(seasonIndex) {
  state.currentSeason  = seasonIndex;
  state.currentEpIndex = 0;

  // Update tab UI
  document.querySelectorAll('.season-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === seasonIndex);
  });

  loadSeason(seasonIndex);
}

function loadSeason(seasonIndex) {
  const seasons = state.animeData?.seasons || [];
  const season  = seasons[seasonIndex];

  state.allEpisodes  = (season?.episodes || []).sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );
  state.filteredEps  = [...state.allEpisodes];
  state.currentRange = 0;

  buildRangeSelect();
  renderEpisodeList();
}

// ── RANGE SELECT (EPS 1–100, 101–200, …) ─────────────────────
function buildRangeSelect() {
  const total = state.allEpisodes.length;
  els.epRangeSelect.innerHTML = '';

  if (total <= state.rangeSize) {
    els.epRangeSelect.style.display = 'none';
    return;
  }

  els.epRangeSelect.style.display = '';
  const rangeCount = Math.ceil(total / state.rangeSize);
  for (let i = 0; i < rangeCount; i++) {
    const start = i * state.rangeSize + 1;
    const end   = Math.min((i + 1) * state.rangeSize, total);
    const opt   = document.createElement('option');
    opt.value   = i;
    opt.textContent = `EPS ${start}–${end}`;
    if (i === state.currentRange) opt.selected = true;
    els.epRangeSelect.appendChild(opt);
  }
}

els.epRangeSelect.addEventListener('change', () => {
  state.currentRange = parseInt(els.epRangeSelect.value);
  renderEpisodeList();
});

// ── RENDER EPISODE LIST ───────────────────────────────────────
function renderEpisodeList() {
  const start  = state.currentRange * state.rangeSize;
  const end    = start + state.rangeSize;
  const slice  = state.filteredEps.slice(start, end);

  els.epList.innerHTML = '';

  if (!slice.length) {
    els.epList.innerHTML = '<li class="ep-no-results">No episodes found</li>';
    return;
  }

  slice.forEach((ep, i) => {
    const li   = document.createElement('li');
    const globalIndex = state.allEpisodes.indexOf(ep);
    li.className = 'ep-item' + (globalIndex === state.currentEpIndex ? ' active' : '');
    li.dataset.index = globalIndex;
    li.innerHTML = `
      <span class="ep-num">${ep.episodeNumber}</span>
      <div class="ep-item-info">
        <div class="ep-item-title">${ep.title || 'Episode ' + ep.episodeNumber}</div>
      </div>
      <svg class="ep-play-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
    li.addEventListener('click', () => playEpisode(globalIndex));
    // Stagger animation
    li.style.animationDelay = `${i * 20}ms`;
    els.epList.appendChild(li);
  });
}

// ── SEARCH ───────────────────────────────────────────────────
els.epSearch.addEventListener('input', () => {
  const q = els.epSearch.value.trim().toLowerCase();
  if (!q) {
    state.filteredEps  = [...state.allEpisodes];
  } else {
    state.filteredEps  = state.allEpisodes.filter(ep =>
      String(ep.episodeNumber).includes(q) ||
      (ep.title || '').toLowerCase().includes(q)
    );
  }
  state.currentRange = 0;
  buildRangeSelect();
  renderEpisodeList();
});

// ── PLAY EPISODE ─────────────────────────────────────────────
function playEpisode(index) {
  const ep = state.allEpisodes[index];
  if (!ep) return;

  state.currentEpIndex = index;

  // Update list highlight
  document.querySelectorAll('.ep-item').forEach(li => {
    li.classList.toggle('active', parseInt(li.dataset.index) === index);
  });

  // Scroll active item into view
  const activeEl = els.epList.querySelector('.ep-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  // Load video
  const videoUrl = ep.videoUrl || '';

  if (videoUrl) {
    els.videoPlaceholder.classList.add('hidden');
    els.videoIframe.classList.remove('hidden');
    els.videoIframe.src = videoUrl;
  } else {
    els.videoIframe.classList.add('hidden');
    els.videoIframe.src = '';
    els.videoPlaceholder.classList.remove('hidden');
  }

  // Update meta
  els.epNumberBadge.textContent = `EP ${ep.episodeNumber}`;
  els.epTitle.textContent = ep.title || `Episode ${ep.episodeNumber}`;
  els.epDesc.textContent  = ep.description || '';
  els.bcEpLabel.textContent = `Episode ${ep.episodeNumber}`;

  // Prev / Next buttons
  els.prevBtn.disabled = index <= 0;
  els.nextBtn.disabled = index >= state.allEpisodes.length - 1;

  // POST view increment (fire-and-forget)
  if (state.animeId) {
    fetch(`${API_BASE}/anime/${state.animeId}/view`, { method: 'POST' }).catch(() => {});
  }
}

// ── PREV / NEXT ───────────────────────────────────────────────
els.prevBtn.addEventListener('click', () => {
  if (state.currentEpIndex > 0) playEpisode(state.currentEpIndex - 1);
});
els.nextBtn.addEventListener('click', () => {
  if (state.currentEpIndex < state.allEpisodes.length - 1)
    playEpisode(state.currentEpIndex + 1);
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────
els.sidebarToggle.addEventListener('click', () => {
  const collapsed = els.epSidebar.classList.toggle('collapsed');
  els.sidebarToggle.textContent = collapsed ? '⟩' : '⟨';
  els.sidebarExpand.classList.toggle('hidden', !collapsed);
});

els.sidebarExpand.addEventListener('click', () => {
  els.epSidebar.classList.remove('collapsed');
  els.sidebarToggle.textContent = '⟨';
  els.sidebarExpand.classList.add('hidden');
});

// ── ERROR STATE ───────────────────────────────────────────────
function showError(msg) {
  els.epList.innerHTML = `<li class="ep-no-results">${msg}</li>`;
}

// ── DEMO DATA (for preview without backend) ──────────────────
function loadDemoData() {
  const demoEpisodes = Array.from({ length: 24 }, (_, i) => ({
    episodeNumber: i + 1,
    title: [
      "I'm Luffy! The Man Who's Gonna Be King of the Pirates!",
      'Enter the Great Swordsman! Pirate Hunter Roronoa Zoro!',
      'Morgan versus Luffy! Who Is the Winner?!',
      "Luffy's Past! The Red-haired Shanks Appears!",
      'A Terrifying Mysterious Power! Captain Buggy, the Clown Pirate!',
      'Desperate Situation! Beast Tamer Mohji vs. Luffy!',
      'Epic Showdown! Swordsman Zoro vs. Acrobat Cabaji!',
      "Who is the Victor? Devil Fruit Power Showdown!",
      "The Honorable Liar? Captain Usopp!",
      "The Weirdest Guy Ever! Jango the Hypnotist!"
    ][i] || `Episode ${i + 1}`,
    description: 'A young pirate sets out to find the legendary treasure.',
    videoUrl: '',
  }));

  state.animeData = {
    title: 'One Piece',
    seasons: [{ seasonNumber: 1, title: 'East Blue Saga', episodes: demoEpisodes }]
  };

  els.bcAnimeTitle.textContent = 'One Piece';
  hydrate();
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'n') {
    if (!els.nextBtn.disabled) playEpisode(state.currentEpIndex + 1);
  }
  if (e.key === 'ArrowLeft' || e.key === 'p') {
    if (!els.prevBtn.disabled) playEpisode(state.currentEpIndex - 1);
  }
});

// ── KICK OFF ──────────────────────────────────────────────────
init();