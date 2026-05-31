// ============================================
//   MYANIME � App
// ============================================

const API = 'https://myanime-backend-2vc9.onrender.com/api';
const PROXY = 'https://myanime-backend-2vc9.onrender.com/api/stream';

function proxyUrl(url) {
  if (!url) return url;
  if (url.includes('.m3u8') || url.includes('.ts')) {
    return `${PROXY}/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const getToken  = () => localStorage.getItem('token');
const setToken  = t  => localStorage.setItem('token', t);
const removeToken = () => localStorage.removeItem('token');
const getUser   = () => JSON.parse(localStorage.getItem('user') || 'null');
const setUser   = u  => localStorage.setItem('user', JSON.stringify(u));
const removeUser = () => localStorage.removeItem('user');

// -- Demo Data ---------------------------------
const DEMO_ANIME = [
  { id:'d1',title:'One Piece',type:'series',genre:'adventure',year:'1999',rating:'TV-14',desc:'Follow Monkey D. Luffy and his pirate crew in search of the world\'s ultimate treasure known as the "One Piece" in order to become the next King of the Pirates.',thumb:'',videoUrl:'',emoji:'?????',trending:true,topRated:true },
  { id:'d2',title:'Attack on Titan',type:'series',genre:'action',year:'2013',rating:'TV-MA',desc:'Humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid beings who devour humans seemingly without reason.',thumb:'',videoUrl:'',emoji:'??',trending:true,topRated:true },
  { id:'d3',title:'Demon Slayer',type:'series',genre:'action',year:'2019',rating:'TV-14',desc:'A young boy becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon.',thumb:'',videoUrl:'',emoji:'???',trending:true,topRated:false },
  { id:'d4',title:'Spirited Away',type:'movie',genre:'fantasy',year:'2001',rating:'PG',desc:'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:true },
  { id:'d5',title:'Naruto',type:'series',genre:'action',year:'2002',rating:'TV-PG',desc:'A young ninja who seeks recognition from his peers and dreams of becoming the Hokage, the leader of his village.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:true },
  { id:'d6',title:'Your Name',type:'movie',genre:'romance',year:'2016',rating:'PG',desc:'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?',thumb:'',videoUrl:'',emoji:'?',trending:true,topRated:true },
  { id:'d7',title:'Fullmetal Alchemist',type:'series',genre:'adventure',year:'2009',rating:'TV-14',desc:'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:true },
  { id:'d8',title:'Dragon Ball Z',type:'series',genre:'action',year:'1989',rating:'TV-PG',desc:'The adventures of Earth\'s martial arts defender, Son Goku, continues with a new family and the revelation of his alien origin.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:false },
  { id:'d9',title:'Princess Mononoke',type:'movie',genre:'fantasy',year:'1997',rating:'PG-13',desc:'On a journey to find the cure for a Tatarigami\'s curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:true },
  { id:'d10',title:'Hunter x Hunter',type:'series',genre:'adventure',year:'2011',rating:'TV-14',desc:'Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness.',thumb:'',videoUrl:'',emoji:'??',trending:true,topRated:false },
  { id:'d11',title:'Jujutsu Kaisen',type:'series',genre:'action',year:'2020',rating:'TV-MA',desc:'A boy swallows a cursed talisman and becomes host to a powerful demon. Now he must battle demons and allies alike to avoid being killed.',thumb:'',videoUrl:'',emoji:'???',trending:true,topRated:true },
  { id:'d12',title:'Sword Art Online',type:'series',genre:'fantasy',year:'2012',rating:'TV-14',desc:'In the near future, a virtual reality massive multiplayer online role-playing game called Sword Art Online is released.',thumb:'',videoUrl:'',emoji:'??',trending:false,topRated:false },
];

// -- State -------------------------------------
let animeLibrary = [];
let myList = [];
let currentModalAnime = null;
let currentPlayerAnime = null;
let uploadedVideoBlob = null;
let uploadedThumbBlob = null;
let currentFilterPage = 'movies';
let editThumbBlob = null;
let featuredHeroId = null;
let toastTimeout;

// -- Admin Auth State --------------------------
let ADMIN_PASSWORD = 'myanime2024';
let adminUnlocked = false;
let loginAttempts = 0;
let lockoutUntil = 0;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60 * 1000;
const ADMIN_EMAIL = 'bhartikunal172@gmail.com';

// -- 2FA OTP State -----------------------------
let otpCode = '';
let otpExpiry = 0;
let otpAttempts = 0;
let otpTimerInterval = null;
let otpPrepared = false;
let twoFAEnabled = false;
let emailJSConfig = { pubkey: '', service: '', template: '' };

// -- Analytics State ---------------------------
let analytics = {
  totalVisits: 0, todayVisits: 0, lastVisitDate: '',
  plays: 0, searches: 0, myListAdds: 0,
  animeViews: {}, searchTerms: {},
  weeklyVisits: [0,0,0,0,0,0,0],
  liveUsers: 1, devices: {}, browsers: {}
};

// -- Row Settings ------------------------------
let rowSettings = {
  trending: { visible:true, title:'?? Trending Now' },
  topRated: { visible:true, title:'? Top Rated' },
  recent:   { visible:true, title:'?? Recently Added' },
  series:   { visible:true, title:'?? Series' },
  movies:   { visible:true, title:'?? Movies' },
};

// -- Secret Shortcut ---------------------------
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') openAdminLogin();
});

// -- WATCH PAGE REDIRECT ---------------------------------------
// Central function � all play/open actions call this instead of
// opening the in-page player. Redirects to watch.html with the
// anime's MongoDB _id and starting episode index (default 0).
function goToWatch(anime, epIndex) {
  if (!anime) return;
  const idx = epIndex !== undefined ? epIndex : 0;
  // Use MongoDB _id if available (backend anime), else fallback to local id
  const id = anime._id || anime.id || '';
  window.location.href = `/watch.html?id=${encodeURIComponent(id)}&ep=${idx}`;
}

// --------------------------------------------
//   INIT
// --------------------------------------------
function init() {
  loadFromStorage();
  if (animeLibrary.length === 0) { animeLibrary = [...DEMO_ANIME]; saveToStorage(); }
  loadAnalytics();
  loadRowSettings();
  loadSecuritySettings();
  loadSavedTheme();
  loadSiteEdits();
  renderAll();
  if (!featuredHeroId && animeLibrary.length > 0) { featuredHeroId = animeLibrary[0].id; }
  renderHero();
  setupNavScroll();
  setupSearchListener();
  populateHomeEditor();
  populateRecommendations();
  populateSiteEditorFields();
  simulateLiveUsers();
  renderLoginHistory();
  trackVisit();
  updateNavForAuth();
  fetchAnimeFromBackend();
  const np = document.getElementById('sec_newPwd');
  if (np) np.addEventListener('input', checkPasswordStrength);
}

// --------------------------------------------
//   STORAGE
// --------------------------------------------
function loadFromStorage() {
  try {
    const lib = localStorage.getItem('myanime_library');
    const ml  = localStorage.getItem('myanime_mylist');
    const pwd = localStorage.getItem('myanime_adminpwd');
    if (lib) animeLibrary = JSON.parse(lib);
    if (ml)  myList = JSON.parse(ml);
    if (pwd) ADMIN_PASSWORD = pwd;
  } catch(e) {}
}

function saveToStorage() {
  try {
    localStorage.setItem('myanime_library', JSON.stringify(animeLibrary));
    localStorage.setItem('myanime_mylist',  JSON.stringify(myList));
  } catch(e) {}
}

function loadAnalytics() {
  try {
    const a = localStorage.getItem('myanime_analytics');
    if (a) analytics = { ...analytics, ...JSON.parse(a) };
  } catch(e) {}
}

function saveAnalytics() {
  try { localStorage.setItem('myanime_analytics', JSON.stringify(analytics)); } catch(e) {}
}

function loadSecuritySettings() {
  try {
    const s = localStorage.getItem('myanime_security');
    if (s) {
      const sec = JSON.parse(s);
      twoFAEnabled  = sec.twoFAEnabled  || false;
      emailJSConfig = sec.emailJSConfig || { pubkey:'', service:'', template:'' };
      lockoutUntil  = sec.lockoutUntil  || 0;
      loginAttempts = sec.loginAttempts || 0;
    }
    const cb = document.getElementById('twofa_enabled');
    if (cb) cb.checked = twoFAEnabled;
    const fields = { ejs_pubkey:'pubkey', ejs_service:'service', ejs_template:'template' };
    Object.entries(fields).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.value = emailJSConfig[key] || '';
    });
  } catch(e) {}
}

function saveSecurity() {
  try {
    localStorage.setItem('myanime_security', JSON.stringify({ twoFAEnabled, emailJSConfig, lockoutUntil, loginAttempts }));
  } catch(e) {}
}

function renderAll() {
  renderHero();
  renderRows();
  renderBrowsePages();
  renderLibraryTab();
}

// --------------------------------------------
//   FETCH ANIME FROM BACKEND
// --------------------------------------------
async function fetchAnimeFromBackend() {
  try {
    const res = await fetch(`${API}/anime`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.anime) && data.anime.length > 0) {
      animeLibrary = data.anime.map(a => ({
        id:       a._id,
        _id:      a._id,   // ? keep raw _id for watch.html redirect
        title:    a.title,
        desc:     a.description,
        type:     a.type,
        genre:    Array.isArray(a.genre) ? a.genre[0] : a.genre,
        year:     String(a.year || ''),
        rating:   a.rating,
        thumb:    a.thumbnailUrl || '',
        videoUrl: a.videoUrl     || '',
        emoji:    '??',
       trending:      a.isTrending || false,
topRated:      a.isTopRated || false,
episodeCount:  Array.isArray(a.episodes) ? a.episodes.length : (a.episodeCount || 0),
latestEpTitle: Array.isArray(a.episodes) && a.episodes.length > 0
               ? (a.episodes[a.episodes.length - 1].title || '') : '',
      }));
      saveToStorage();
      renderAll();
      if (animeLibrary.length > 0) {
        const heroExists = featuredHeroId && animeLibrary.find(a => a.id === featuredHeroId);
        if (!heroExists) {
          const withThumb = animeLibrary.find(a => a.thumb && a.thumb.length > 10);
          featuredHeroId = withThumb ? withThumb.id : animeLibrary[0].id;
          localStorage.setItem('myanime_hero', featuredHeroId);
        }
        renderHero();
      }
    }
  } catch (err) {
    console.log('Backend fetch failed, using local data:', err.message);
  }
}

// --------------------------------------------
//   ADD ANIME
// --------------------------------------------
async function addAnime() {
  const title    = document.getElementById('animeTitle').value.trim();
  const desc     = document.getElementById('animeDesc').value.trim();
  const type     = document.getElementById('animeType').value;
  const year     = document.getElementById('animeYear').value;
  const genre    = document.getElementById('animeGenre').value;
  const rating   = document.getElementById('animeRating').value.trim() || 'TV-14';
  const cloudUrl = document.getElementById('cloudUrl').value.trim();

  if (!title) { showToast('?? Title is required!'); return; }

  let thumbnailUrl = '';
  if (uploadedThumbBlob && uploadedThumbBlob.startsWith('data:')) {
    try {
      showToast('? Uploading thumbnail...');
      const formData = new FormData();
      const blob = await fetch(uploadedThumbBlob).then(r => r.blob());
      formData.append('thumbnail', blob, 'thumbnail.jpg');
      const thumbRes = await fetch(`${API}/upload/thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      const thumbData = await thumbRes.json();
      if (thumbData.success) {
        thumbnailUrl = thumbData.thumbnailUrl;
      } else {
        showToast('?? Thumbnail upload failed: ' + thumbData.message);
      }
    } catch (err) {
      console.log('Thumbnail upload error:', err.message);
      showToast('?? Thumbnail upload failed, saving without it.');
    }
  }

  try {
    showToast('? Saving anime...');
    const res = await fetch(`${API}/anime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        title, description: desc, type,
        year: parseInt(year) || new Date().getFullYear(),
        genre: [genre], rating,
        videoUrl: cloudUrl, thumbnailUrl, isPublished: true
      })
    });
    const data = await res.json();
    if (data.success) {
      const emoji = { action:'??', adventure:'???', romance:'??', fantasy:'?', thriller:'??' }[genre] || '??';
      animeLibrary.unshift({
        id: data.anime._id, _id: data.anime._id, title, desc, type, genre,
        year: String(year), rating, thumb: thumbnailUrl,
        videoUrl: cloudUrl, emoji, trending: false, topRated: false
      });
      saveToStorage(); renderAll();
      showToast(`? "${title}" saved to database!`);
      ['animeTitle','animeDesc','cloudUrl','animeRating'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      document.getElementById('videoProgress').style.display = 'none';
      document.getElementById('videoFill').style.width = '0%';
      document.getElementById('thumbPreview').style.display = 'none';
      document.getElementById('thumbPreviewIcon').style.display = 'block';
      uploadedVideoBlob = null; uploadedThumbBlob = null;
    } else {
      showToast('? ' + data.message);
    }
  } catch (err) {
    showToast('? Cannot connect to server!');
    console.log('Save error:', err.message);
  }
}

// --------------------------------------------
//   ANALYTICS
// --------------------------------------------
function trackVisit() {
  analytics.totalVisits++;
  const today = new Date().toDateString();
  if (analytics.lastVisitDate !== today) { analytics.todayVisits = 0; analytics.lastVisitDate = today; }
  analytics.todayVisits++;
  analytics.weeklyVisits[6] = (analytics.weeklyVisits[6] || 0) + 1;
  const ua = navigator.userAgent;
  const device = /Mobi|Android/i.test(ua) ? 'Mobile' : /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Desktop';
  analytics.devices[device] = (analytics.devices[device] || 0) + 1;
  let browser = 'Other';
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua))        browser = 'Chrome';
  else if (/Firefox/i.test(ua))                        browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua))                           browser = 'Edge';
  analytics.browsers[browser] = (analytics.browsers[browser] || 0) + 1;
  saveAnalytics();
}

function trackPlay(animeId) {
  analytics.plays++;
  analytics.animeViews[animeId] = (analytics.animeViews[animeId] || 0) + 1;
  saveAnalytics();
}

function trackSearch(term) {
  if (!term || term.length < 2) return;
  analytics.searches++;
  const t = term.toLowerCase().trim();
  analytics.searchTerms[t] = (analytics.searchTerms[t] || 0) + 1;
  saveAnalytics();
}

function trackMyListAdd() { analytics.myListAdds++; saveAnalytics(); }
function simulateLiveUsers() {}

function refreshAnalytics() {
  const el = id => document.getElementById(id);
  if (!el('statTotalVisits')) return;
  el('statTotalVisits').textContent = analytics.totalVisits;
  el('statTodayVisits').textContent = analytics.todayVisits;
  el('statPlays').textContent       = analytics.plays;
  el('statSearches').textContent    = analytics.searches;
  el('statMyListAdds').textContent  = analytics.myListAdds;
  el('statLiveUsers').textContent   = analytics.totalVisits;

  const maxV = Math.max(...analytics.weeklyVisits, 1);
  const chart = el('visitBarChart'); const labels = el('visitBarLabels');
  if (chart) {
    chart.innerHTML = ''; labels.innerHTML = '';
    analytics.weeklyVisits.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'bar-day';
      bar.style.height = Math.max(4, (v / maxV) * 100) + 'px';
      bar.setAttribute('data-val', v);
      chart.appendChild(bar);
      const lbl = document.createElement('div');
      lbl.className = 'bar-label';
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      lbl.textContent = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      labels.appendChild(lbl);
    });
  }

  const topAnime = el('topAnimeList');
  if (topAnime) {
    const sorted = Object.entries(analytics.animeViews).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxA = sorted[0]?.[1] || 1;
    topAnime.innerHTML = sorted.length === 0
      ? '<p style="color:#555;font-size:0.85rem">No plays yet.</p>'
      : sorted.map(([id, cnt], idx) => {
          const anime = animeLibrary.find(a => a.id === id);
          if (!anime) return '';
          return `<div class="top-list-item">
            <div class="top-list-rank">${idx+1}</div>
            <div class="top-list-bar-wrap">
              <div class="top-list-name">${anime.emoji||'??'} ${anime.title}</div>
              <div class="top-list-bar" style="width:${(cnt/maxA)*100}%"></div>
            </div>
            <div class="top-list-count">${cnt}</div>
          </div>`;
        }).join('');
  }

  const topSearch = el('topSearchList');
  if (topSearch) {
    const sorted = Object.entries(analytics.searchTerms).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxS = sorted[0]?.[1] || 1;
    topSearch.innerHTML = sorted.length === 0
      ? '<p style="color:#555;font-size:0.85rem">No searches yet.</p>'
      : sorted.map(([term, cnt], idx) => `
          <div class="top-list-item">
            <div class="top-list-rank">${idx+1}</div>
            <div class="top-list-bar-wrap">
              <div class="top-list-name">?? ${term}</div>
              <div class="top-list-bar" style="width:${(cnt/maxS)*100}%"></div>
            </div>
            <div class="top-list-count">${cnt}</div>
          </div>`).join('');
  }

  const deviceList = el('deviceList');
  if (deviceList) {
    const devTotal = Object.values(analytics.devices).reduce((a,b)=>a+b,0)||1;
    const icons = { Desktop:'???', Mobile:'??', Tablet:'??' };
    deviceList.innerHTML = Object.keys(analytics.devices).length === 0
      ? '<p style="color:#555;font-size:0.85rem">No data yet.</p>'
      : Object.entries(analytics.devices).map(([name, cnt]) => `
          <div class="top-list-item">
            <div class="top-list-rank">${icons[name]||'??'}</div>
            <div class="top-list-bar-wrap">
              <div class="top-list-name">${name}</div>
              <div class="top-list-bar" style="width:${(cnt/devTotal)*100}%"></div>
            </div>
            <div class="top-list-count">${cnt} (${Math.round(cnt/devTotal*100)}%)</div>
          </div>`).join('');
  }

  const browserList = el('browserList');
  if (browserList) {
    const brTotal = Object.values(analytics.browsers).reduce((a,b)=>a+b,0)||1;
    const icons = { Chrome:'??', Firefox:'??', Safari:'??', Edge:'??' };
    browserList.innerHTML = Object.keys(analytics.browsers).length === 0
      ? '<p style="color:#555;font-size:0.85rem">No data yet.</p>'
      : Object.entries(analytics.browsers).map(([name, cnt]) => `
          <div class="top-list-item">
            <div class="top-list-rank">${icons[name]||'??'}</div>
            <div class="top-list-bar-wrap">
              <div class="top-list-name">${name}</div>
              <div class="top-list-bar" style="width:${(cnt/brTotal)*100}%"></div>
            </div>
            <div class="top-list-count">${cnt} (${Math.round(cnt/brTotal*100)}%)</div>
          </div>`).join('');
  }

  showToast('?? Analytics refreshed');
}

function resetAnalytics() {
  if (!confirm('Reset all analytics data? This cannot be undone.')) return;
  analytics = { totalVisits:0, todayVisits:0, lastVisitDate:'', plays:0, searches:0, myListAdds:0, animeViews:{}, searchTerms:{}, weeklyVisits:[0,0,0,0,0,0,0], liveUsers:1, devices:{}, browsers:{} };
  saveAnalytics(); refreshAnalytics();
  showToast('??? Analytics reset.');
}

// --------------------------------------------
//   ADMIN AUTH
// --------------------------------------------
function openAdminLogin() {
  if (adminUnlocked) { showPage('admin'); return; }
  if (Date.now() < lockoutUntil) {
    const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
    const info = document.getElementById('loginAttemptInfo');
    info.style.display = 'block';
    info.textContent = `?? Too many failed attempts. Try again in ${mins} minute(s).`;
  }
  document.getElementById('adminLoginModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('adminPasswordInput').focus(), 100);
}

function closeAdminLogin() {
  document.getElementById('adminLoginModal').classList.remove('active');
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminError').style.display = 'none';
  document.getElementById('loginAttemptInfo').style.display = 'none';
  document.body.style.overflow = '';
  otpPrepared = false;
}

function checkAdminPassword() {
  if (Date.now() < lockoutUntil) {
    const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
    showToast(`?? Locked out for ${mins} more minute(s).`);
    return;
  }
  const input = document.getElementById('adminPasswordInput').value;
  if (input === ADMIN_PASSWORD) {
    loginAttempts = 0; saveSecurity();
    document.getElementById('adminPasswordInput').value = '';
    if (twoFAEnabled && emailJSConfig.pubkey && emailJSConfig.service && emailJSConfig.template) {
      closeAdminLogin(); initiate2FA();
    } else {
      grantAdminAccess();
    }
  } else {
    loginAttempts++;
    addLoginEntry('failed', `Wrong password (attempt ${loginAttempts}/${MAX_ATTEMPTS})`);
    const remaining = MAX_ATTEMPTS - loginAttempts;
    if (loginAttempts >= MAX_ATTEMPTS) {
      lockoutUntil = Date.now() + LOCKOUT_DURATION;
      saveSecurity();
      addLoginEntry('locked', 'Account locked for 30 minutes');
      document.getElementById('adminError').style.display = 'none';
      const info = document.getElementById('loginAttemptInfo');
      info.style.display = 'block';
      info.textContent = '?? Too many failed attempts! Locked for 30 minutes.';
      document.getElementById('adminPasswordInput').value = '';
    } else {
      saveSecurity();
      const errEl = document.getElementById('adminError');
      errEl.style.display = 'block';
      errEl.textContent = `? Wrong password. ${remaining} attempt(s) remaining.`;
      document.getElementById('adminPasswordInput').value = '';
      document.getElementById('adminPasswordInput').focus();
    }
  }
}

function grantAdminAccess() {
  adminUnlocked = true;
  closeAdminLogin(); closeOTPModal();
  document.getElementById('adminBtn').style.display = 'flex';
  showPage('admin');
  addLoginEntry('success', '? Login successful');
  showToast('? Admin access granted!');
}

// --------------------------------------------
//   2FA / OTP
// --------------------------------------------
const OTP_POOL = ['2546','4896','47562','444444','85289','15679','47569','25489','12356','902714','56489','2035682'];
function generateOTP() { return OTP_POOL[Math.floor(Math.random() * OTP_POOL.length)]; }

function onPasswordTyped() {
  const val = document.getElementById('adminPasswordInput').value;
  if (val.length > 0 && !otpPrepared) {
    otpPrepared = true;
    otpCode = generateOTP();
    otpExpiry = Date.now() + 5 * 60 * 1000;
    otpAttempts = 0;
    _sendOTPEmail(otpCode);
    showToast('?? Login attempt detected � OTP sent to your email!');
  }
}

function _sendOTPEmail(code) {
  if (typeof emailjs !== 'undefined' && emailJSConfig.pubkey && emailJSConfig.service && emailJSConfig.template) {
    emailjs.init(emailJSConfig.pubkey);
    emailjs.send(emailJSConfig.service, emailJSConfig.template, {
      otp_code: code, to_email: ADMIN_EMAIL,
      site_name: document.querySelector('.logo-text')?.textContent || 'MyAnime'
    }).then(() => showToast('?? OTP sent to ' + ADMIN_EMAIL))
      .catch(err => { console.error('EmailJS error:', err); showToast('?? Could not send OTP email. Check EmailJS config.'); });
  } else {
    console.log('%c?? DEV MODE OTP: ' + code, 'color:#e50914;font-size:20px;font-weight:bold;');
    showToast('?? OTP: ' + code + ' (EmailJS not configured)');
  }
}

function initiate2FA() {
  if (!otpPrepared || !otpCode) {
    otpCode = generateOTP();
    otpExpiry = Date.now() + 5 * 60 * 1000;
    otpAttempts = 0;
    _sendOTPEmail(otpCode);
  } else {
    showToast('?? OTP already sent to ' + ADMIN_EMAIL);
  }
  otpPrepared = false;
  document.getElementById('otpModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('otpError').style.display = 'none';
  const singleInput = document.getElementById('otpSingleInput');
  if (singleInput) singleInput.value = '';
  startOTPTimer();
  setTimeout(() => { if (singleInput) singleInput.focus(); }, 100);
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;
  resendBtn.textContent = '?? Resend Code (wait 30s...)';
  setTimeout(() => { resendBtn.disabled = false; resendBtn.textContent = '?? Resend Code'; }, 30000);
}

function startOTPTimer() {
  clearInterval(otpTimerInterval);
  const timerEl = document.getElementById('otpTimerCount');
  otpTimerInterval = setInterval(() => {
    const left = Math.max(0, otpExpiry - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    if (timerEl) timerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    if (left <= 0) {
      clearInterval(otpTimerInterval);
      const err = document.getElementById('otpError');
      err.style.display = 'block'; err.textContent = '? Code expired. Please try again.';
      document.getElementById('otpVerifyBtn').disabled = true;
    }
  }, 1000);
}

function closeOTPModal() {
  document.getElementById('otpModal').classList.remove('active');
  document.body.style.overflow = '';
  clearInterval(otpTimerInterval);
}

function verifyOTP() {
  const singleInput = document.getElementById('otpSingleInput');
  const entered = singleInput ? singleInput.value.trim() : '';
  const errEl = document.getElementById('otpError');
  if (!entered) { errEl.style.display = 'block'; errEl.textContent = '?? Please enter your OTP code.'; return; }
  if (Date.now() > otpExpiry) { errEl.style.display = 'block'; errEl.textContent = '? Code expired. Please resend.'; return; }
  otpAttempts++;
  if (entered === otpCode) {
    grantAdminAccess();
  } else {
    if (otpAttempts >= 3) {
      closeOTPModal();
      lockoutUntil = Date.now() + LOCKOUT_DURATION;
      saveSecurity();
      addLoginEntry('locked', 'Locked after 3 wrong OTP attempts');
      showToast('?? Too many wrong codes. Locked for 30 min.');
    } else {
      errEl.style.display = 'block';
      errEl.textContent = `? Wrong code. ${3 - otpAttempts} attempt(s) left.`;
      if (singleInput) { singleInput.value = ''; singleInput.focus(); }
    }
  }
}

function resendOTP() {
  otpPrepared = false;
  otpCode = generateOTP();
  otpExpiry = Date.now() + 5 * 60 * 1000;
  otpAttempts = 0;
  _sendOTPEmail(otpCode);
  document.getElementById('otpError').style.display = 'none';
  const singleInput = document.getElementById('otpSingleInput');
  if (singleInput) { singleInput.value = ''; singleInput.focus(); }
  startOTPTimer();
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;
  resendBtn.textContent = '?? Resend Code (wait 30s...)';
  setTimeout(() => { resendBtn.disabled = false; resendBtn.textContent = '?? Resend Code'; }, 30000);
}

// --------------------------------------------
//   SECURITY SETTINGS
// --------------------------------------------
function toggle2FA() {
  twoFAEnabled = document.getElementById('twofa_enabled').checked;
  saveSecurity();
  showToast(twoFAEnabled ? '? 2FA enabled' : '?? 2FA disabled');
}

function saveEmailJSConfig() {
  emailJSConfig = {
    pubkey:   document.getElementById('ejs_pubkey').value.trim(),
    service:  document.getElementById('ejs_service').value.trim(),
    template: document.getElementById('ejs_template').value.trim()
  };
  saveSecurity();
  showToast('?? EmailJS config saved!');
}

function testEmailJS() {
  const pk = document.getElementById('ejs_pubkey').value.trim();
  const sv = document.getElementById('ejs_service').value.trim();
  const tm = document.getElementById('ejs_template').value.trim();
  if (!pk || !sv || !tm) { showToast('?? Fill in all EmailJS fields first.'); return; }
  if (typeof emailjs === 'undefined') { showToast('?? EmailJS library not loaded.'); return; }
  emailjs.init(pk);
  emailjs.send(sv, tm, { otp_code: generateOTP(), to_email: ADMIN_EMAIL, site_name: 'MyAnime' })
    .then(() => showToast('? Test OTP sent! Check ' + ADMIN_EMAIL))
    .catch(() => showToast('? EmailJS send failed. Check your config.'));
}

function changeAdminPassword() {
  const current = document.getElementById('sec_currentPwd').value;
  const newPwd  = document.getElementById('sec_newPwd').value;
  const confirm = document.getElementById('sec_confirmPwd').value;
  if (current !== ADMIN_PASSWORD) { showToast('? Current password is wrong.'); return; }
  if (newPwd.length < 8) { showToast('?? Password must be at least 8 characters.'); return; }
  if (newPwd !== confirm) { showToast('? Passwords do not match.'); return; }
  ADMIN_PASSWORD = newPwd;
  localStorage.setItem('myanime_adminpwd', ADMIN_PASSWORD);
  ['sec_currentPwd','sec_newPwd','sec_confirmPwd'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('pwdStrengthFill').style.width = '0%';
  document.getElementById('pwdStrengthLabel').textContent = '';
  showToast('? Password changed successfully!');
}

function checkPasswordStrength() {
  const pwd = document.getElementById('sec_newPwd').value;
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const fill  = document.getElementById('pwdStrengthFill');
  const label = document.getElementById('pwdStrengthLabel');
  const colors = ['#e57373','#e57373','#ff9800','#ffeb3b','#4caf50'];
  const labels = ['Weak','Weak','Fair','Good','Strong'];
  fill.style.width      = (score * 20) + '%';
  fill.style.background = colors[score-1] || '#333';
  label.textContent     = pwd ? (labels[score-1] || '') : '';
  label.style.color     = colors[score-1] || '#aaa';
}

function lockAdminNow() {
  adminUnlocked = false;
  document.getElementById('adminBtn').style.display = 'none';
  showPage('home');
  showToast('?? Admin locked.');
}

function resetAllData() {
  if (!confirm('?? This will reset ALL site data including library, settings, and analytics. Are you absolutely sure?')) return;
  if (!confirm('Final confirmation: Delete everything?')) return;
  localStorage.clear();
  showToast('??? All data reset. Reloading...');
  setTimeout(() => location.reload(), 1500);
}

function addLoginEntry(type, msg) {
  try {
    const hist = JSON.parse(localStorage.getItem('myanime_loginhistory') || '[]');
    hist.unshift({ type, msg, time: new Date().toLocaleString() });
    if (hist.length > 20) hist.splice(20);
    localStorage.setItem('myanime_loginhistory', JSON.stringify(hist));
    renderLoginHistory();
  } catch(e) {}
}

function renderLoginHistory() {
  const container = document.getElementById('loginHistory');
  if (!container) return;
  try {
    const hist = JSON.parse(localStorage.getItem('myanime_loginhistory') || '[]');
    if (hist.length === 0) {
      container.innerHTML = '<p style="color:#555;font-size:0.85rem">No login attempts recorded yet.</p>';
      return;
    }
    container.innerHTML = hist.map(h => `
      <div class="login-entry ${h.type}">
        <span class="login-entry-status">${h.msg}</span>
        <span class="login-entry-time">${h.time}</span>
      </div>`).join('');
  } catch(e) {}
}

function clearLoginHistory() {
  localStorage.removeItem('myanime_loginhistory');
  renderLoginHistory();
  showToast('??? Login history cleared.');
}

// --------------------------------------------
//   NAVBAR
// --------------------------------------------
function setupNavScroll() {
  const nb = document.getElementById('navbar');
  window.addEventListener('scroll', () => nb.classList.toggle('scrolled', window.scrollY > 80));
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const map = { home:'homePage', movies:'moviesPage', series:'seriesPage', mylist:'mylistPage', admin:'adminPage', search:'searchPage' };
  const pg = document.getElementById(map[page]);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.getAttribute('onclick')?.includes(`'${page}'`)) l.classList.add('active');
  });
  window.scrollTo({ top:0, behavior:'smooth' });
  if (page === 'mylist') renderMyList();
  if (page === 'movies') renderGrid('moviesGrid', animeLibrary.filter(a => a.type === 'movie'));
  if (page === 'series') renderGrid('seriesGrid', animeLibrary.filter(a => a.type === 'series'));
  if (page === 'admin') {
    populateHomeEditor(); populateRecommendations();
    populateSiteEditorFields(); refreshAnalytics(); renderLoginHistory();
  }
}

// --------------------------------------------
//   HERO
// --------------------------------------------
function renderHero() {
  const featured = (featuredHeroId && animeLibrary.find(a => a.id === featuredHeroId)) || animeLibrary.find(a => a.thumb && a.thumb.length > 10) || animeLibrary[0];
  if (!featured) return;
  const edits = getSiteEdits();
  const badge = document.querySelector('.hero-badge');
  if (badge && edits.heroBadge) badge.textContent = edits.heroBadge;
  document.getElementById('heroTitle').textContent = featured.title;
  document.getElementById('heroDesc').textContent  = featured.desc || 'An epic anime adventure awaits.';
  document.getElementById('heroYear').textContent  = featured.year || '';
  const playBtn = document.querySelector('.btn-play');
  const infoBtn = document.querySelector('.btn-info');
  if (playBtn && edits.playBtn) playBtn.textContent = edits.playBtn;
  if (infoBtn && edits.infoBtn) infoBtn.textContent = edits.infoBtn;
  const bg = document.getElementById('heroBg');
  if (featured.thumb && (featured.thumb.startsWith('data:') || featured.thumb.startsWith('http'))) {
    bg.style.background = `url(${featured.thumb}) center/cover no-repeat`;
  } else {
    bg.style.background = getGradient(featured.id);
  }
}

// -- FIX 1: Hero Play button ? go to watch.html ---------------
function playHeroAnime() {
  const featured = (featuredHeroId && animeLibrary.find(a => a.id === featuredHeroId))
    || animeLibrary.find(a => a.topRated) || animeLibrary[0];
  if (featured) goToWatch(featured, 0);
}

function getGradient(id) {
  const gradients = [
    'linear-gradient(135deg,#1a0a0a,#0d1a2e)',
    'linear-gradient(135deg,#0a0a1a,#1a2e0d)',
    'linear-gradient(135deg,#1a0a0a,#2e0d1a)',
    'linear-gradient(135deg,#0d2e1a,#1a0a2e)',
    'linear-gradient(135deg,#2e1a0a,#0a1a2e)',
  ];
  const idx = (id || '').charCodeAt(1) % gradients.length;
  return gradients[idx >= 0 ? idx : 0];
}

// --------------------------------------------
//   ROWS & CARDS
// --------------------------------------------

function applyRowVisibility() {
  const rowMap = { trending:'trendingRow', topRated:'topRatedRow', recent:'recentRow', series:'seriesRow', movies:'moviesRowHome' };
  ['trending','topRated','recent','series','movies'].forEach(key => {
    const rowEl = document.getElementById(rowMap[key])?.closest('.anime-row');
    if (rowEl) {
      rowEl.style.display = rowSettings[key].visible ? '' : 'none';
      const titleEl = rowEl.querySelector('.row-title');
      if (titleEl) titleEl.textContent = rowSettings[key].title;
    }
  });
}
function loadRowSettings() {
  try {
    const s = localStorage.getItem('myanime_rowsettings');
    if (s) rowSettings = { ...rowSettings, ...JSON.parse(s) };
    const h = localStorage.getItem('myanime_hero');
    if (h) featuredHeroId = h;
  } catch(e) {}
}

function saveRowSettings() {
  ['trending','topRated','recent','series','movies'].forEach(key => {
    const cb = document.getElementById('toggle_' + key);
    const ti = document.getElementById('rowTitle_' + key);
    if (cb) rowSettings[key].visible = cb.checked;
    if (ti && ti.value.trim()) rowSettings[key].title = ti.value.trim();
  });
  localStorage.setItem('myanime_rowsettings', JSON.stringify(rowSettings));
}

function applyRowSettings() {
  saveRowSettings();
  const rowMap = { trending:'trendingRow', topRated:'topRatedRow', recent:'recentRow', series:'seriesRow', movies:'moviesRowHome' };
  ['trending','topRated','recent','series','movies'].forEach(key => {
    const rowEl = document.getElementById(rowMap[key])?.closest('.anime-row');
    if (rowEl) {
      rowEl.style.display = rowSettings[key].visible ? '' : 'none';
      const titleEl = rowEl.querySelector('.row-title');
      if (titleEl) titleEl.textContent = rowSettings[key].title;
    }
  });
  showToast('? Home page updated!');
}

function renderRows() { setTimeout(applyRowVisibility, 50);
  renderRow('trendingRow',   animeLibrary.filter(a => a.trending));
  renderRow('topRatedRow',   animeLibrary.filter(a => a.topRated));
  renderRow('recentRow',     [...animeLibrary].reverse().slice(0, 8));
  renderRow('seriesRow',     animeLibrary.filter(a => a.type === 'series'));
  renderRow('moviesRowHome', animeLibrary.filter(a => a.type === 'movie'));
}

function renderRow(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((anime, i) => container.appendChild(createCard(anime, i)));
}

function hasValidThumb(anime) {
  return anime.thumb && (anime.thumb.startsWith('data:') || anime.thumb.startsWith('http'));
}

// -- FIX 2: Card play button ? go to watch.html ---------------
function createCard(anime) {
  const div = document.createElement('div');
  div.className = 'anime-card';
  const inList = myList.some(m => m.id === anime.id);
  const thumbOk = hasValidThumb(anime);
  const thumbHtml = thumbOk
    ? `<img class="card-thumb" src="${anime.thumb}" alt="${anime.title}" loading="lazy"/>`
    : `<div class="card-thumb-placeholder"><span style="font-size:2rem">${anime.emoji||'??'}</span><span>${anime.title}</span></div>`;
  const hoverThumbHtml = thumbOk
    ? `<img class="card-hover-img" src="${anime.thumb}" alt="${anime.title}"/>`
    : `<div class="card-hover-img" style="background:${getGradient(anime.id)};display:flex;align-items:center;justify-content:center;font-size:2.5rem">${anime.emoji||'??'}</div>`;

  // Clicking the thumbnail itself also goes to watch.html
  div.style.cursor = 'pointer';
  div.addEventListener('click', (e) => {
    // Don't navigate if user clicked a button inside the card
    if (e.target.closest('button')) return;
    goToWatch(anime, 0);
  });

  div.innerHTML = `${thumbHtml}
    <div class="card-hover">
      ${hoverThumbHtml}
      <div class="card-hover-body">
        <div class="card-hover-actions">
          <button class="card-play-btn" onclick="goToWatch(animeLibrary.find(a=>a.id==='${anime.id}'),0)" title="Play">?</button>
          <button class="card-list-btn ${inList?'added':''}" id="listbtn-${anime.id}" onclick="toggleListById('${anime.id}',this)" title="My List">${inList?'?':'+'}</button>
          <button class="card-info-btn" onclick="showInfoModal_byId('${anime.id}')" title="More Info">i</button>
        </div>
        <div class="card-title">${anime.title}</div>
        <div class="card-meta">
          <span class="card-year">${anime.year||''}</span>
          <span class="card-badge">${anime.rating||'HD'}</span>
          <span class="card-genre">${anime.genre||''}</span>
        </div>
      </div>
    </div>`;
  return div;
}

// --------------------------------------------
//   BROWSE GRIDS
// --------------------------------------------
function renderBrowsePages() {
  renderGrid('moviesGrid', animeLibrary.filter(a => a.type === 'movie'));
  renderGrid('seriesGrid', animeLibrary.filter(a => a.type === 'series'));
}

function renderGrid(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const edits = getSiteEdits();
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-list"><div style="font-size:3rem">??</div><p>${edits.noResults || 'No content found.'}</p></div>`;
    return;
  }
  items.forEach(anime => container.appendChild(createGridCard(anime)));
}

// -- FIX 3: Grid card play button ? go to watch.html ----------
function createGridCard(anime) {
  const div = document.createElement('div');
  div.className = 'grid-card';
  div.style.cursor = 'pointer';
  const thumbOk = hasValidThumb(anime);
  const innerHtml = thumbOk
    ? `<img src="${anime.thumb}" alt="${anime.title}" loading="lazy"/>`
    : `<div class="grid-card-placeholder" style="background:${getGradient(anime.id)}"><span>${anime.emoji||'??'}</span><span>${anime.title}</span></div>`;

  div.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    goToWatch(anime, 0);
  });

  div.innerHTML = `${innerHtml}
    <div class="grid-card-overlay">
      <div class="grid-card-title">${anime.title}</div>
      <div class="grid-card-meta">${anime.year||''} � ${anime.genre||''}</div>
      <div class="grid-card-actions">
        <button class="gc-play" onclick="goToWatch(animeLibrary.find(a=>a.id==='${anime.id}'),0)">? Play</button>
        <button class="gc-play" style="background:rgba(109,109,110,0.7);color:white" onclick="showInfoModal_byId('${anime.id}')">? Info</button>
      </div>
    </div>`;
  return div;
}

function filterContent(genre, type) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentFilterPage = type;
  let items = animeLibrary.filter(a => a.type === type);
  if (genre !== 'all') items = items.filter(a => a.genre === genre);
  renderGrid(type === 'movies' ? 'moviesGrid' : 'seriesGrid', items);
}

// --------------------------------------------
//   MY LIST
// --------------------------------------------
function renderMyList() {
  const grid = document.getElementById('mylistGrid');
  const edits = getSiteEdits();
  if (myList.length === 0) {
    grid.innerHTML = `<div class="empty-list"><div style="font-size:4rem">??</div><p>${edits.emptyList || 'Your list is empty. Add anime to watch later!'}</p></div>`;
    return;
  }
  renderGrid('mylistGrid', myList);
}

function toggleListById(id, btn) {
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime) return;
  const idx = myList.findIndex(m => m.id === id);
  if (idx >= 0) {
    myList.splice(idx, 1);
    if (btn) { btn.textContent = '+'; btn.classList.remove('added'); }
    showToast(`Removed "${anime.title}" from My List`);
  } else {
    myList.push(anime);
    if (btn) { btn.textContent = '?'; btn.classList.add('added'); }
    trackMyListAdd();
    showToast(`Added "${anime.title}" to My List`);
  }
  saveToStorage(); updateMyListBtn();
}

function updateMyListBtn() {
  if (!currentModalAnime) return;
  const btn = document.getElementById('mylistBtn');
  const inList = myList.some(m => m.id === currentModalAnime.id);
  if (btn) { btn.textContent = inList ? '? In My List' : '+ My List'; btn.classList.toggle('added', inList); }
}

// --------------------------------------------
//   INFO MODAL
// --------------------------------------------
function showInfoModal(idx) {
  const anime = animeLibrary[idx];
  if (anime) showInfoModal_byId(anime.id);
}

function showInfoModal_byId(id) {
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime) return;
  currentModalAnime = anime;
  document.getElementById('modalTitle').textContent  = anime.title;
  document.getElementById('modalYear').textContent   = anime.year || '';
  document.getElementById('modalRating').textContent = anime.rating || '';
  document.getElementById('modalType').textContent   = anime.type === 'series' ? '?? Series' : '?? Movie';
  document.getElementById('modalDesc').textContent   = anime.desc || 'No description available.';
  document.getElementById('modalGenre').textContent  = anime.genre || 'N/A';
  const thumb = document.getElementById('modalThumb');
  if (hasValidThumb(anime)) {
    thumb.src = anime.thumb; thumb.style.display = 'block';
  } else {
    thumb.src = '';
    thumb.style.cssText = `background:${getGradient(anime.id)};display:flex;align-items:center;justify-content:center;font-size:5rem`;
    thumb.style.display = 'block';
  }
  updateMyListBtn();
  document.getElementById('infoModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('infoModal').classList.remove('active');
  document.body.style.overflow = '';
}

// -- FIX 4: Modal Play button ? go to watch.html --------------
function playFromModal() {
  closeModal();
  if (currentModalAnime) goToWatch(currentModalAnime, 0);
}

function toggleMyList() {
  if (!currentModalAnime) return;
  const id = currentModalAnime.id;
  const idx = myList.findIndex(m => m.id === id);
  if (idx >= 0) { myList.splice(idx, 1); showToast(`Removed "${currentModalAnime.title}" from My List`); }
  else { myList.push(currentModalAnime); trackMyListAdd(); showToast(`Added "${currentModalAnime.title}" to My List`); }
  saveToStorage(); updateMyListBtn();
}

// --------------------------------------------
//   VIDEO PLAYER (kept for admin preview only)
// --------------------------------------------
function openPlayer(anime, episodeUrl, episodeTitle) {
  if (!anime) return;
  // Redirect to dedicated watch page instead of in-page player
  goToWatch(anime, 0);
}

function playEpisode(animeId, videoUrl, episodeTitle) {
  const anime = animeLibrary.find(a => a.id === animeId);
  if (anime) goToWatch(anime, 0);
}

function closePlayer() {
  const video = document.getElementById('mainPlayer');
  if (video) { video.pause(); video.src = ''; }
  const iframe = document.getElementById('embedPlayer');
  if (iframe) iframe.src = '';
  document.getElementById('playerOverlay').classList.remove('active');
  document.body.style.overflow = '';
  const msg = document.querySelector('.no-video-msg');
  if (msg) msg.remove();
}

function toggleFullscreen() {
  const el = document.getElementById('playerOverlay');
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function playNext() {
  if (!currentPlayerAnime) return;
  const idx  = animeLibrary.findIndex(a => a.id === currentPlayerAnime.id);
  const next = animeLibrary[(idx + 1) % animeLibrary.length];
  goToWatch(next, 0);
}

// --------------------------------------------
//   SEARCH
// --------------------------------------------
function setupSearchListener() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  let timeout;
  input.addEventListener('input', e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length >= 2) {
        trackSearch(q);
        showPage('search'); mspPopulateTrending();
        const mspInput = document.getElementById('mspInput');
        if (mspInput) mspInput.value = q;
        const results = animeLibrary.filter(a => a.title.toLowerCase().includes(q.toLowerCase())); renderGrid('searchGrid', results);
      } else if (q.length === 0) {
        showPage('home');
      }
    }, 300);
  });
}

function handleSearch(e) {
  if (e.key === 'Enter') {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
      trackSearch(q);
      const results = animeLibrary.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
      showPage('search'); mspPopulateTrending(); renderGrid('searchGrid', results);
    }
  }
}

// --------------------------------------------
//   RESOLUTION SELECTOR
// --------------------------------------------
let currentResolution = 'auto';

function toggleResMenu() {
  const menu = document.getElementById('resMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function setResolution(res) {
  currentResolution = res;
  document.getElementById('resBtn').textContent = `?? ${res === 'auto' ? 'Auto' : res}`;
  document.getElementById('resMenu').style.display = 'none';
  document.querySelectorAll('.res-option').forEach(o => o.classList.toggle('active', o.textContent.toLowerCase().includes(res)));
  showToast(res === 'auto' ? '? Resolution: Auto' : `?? Resolution set to ${res}`);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.resolution-selector')) {
    const menu = document.getElementById('resMenu');
    if (menu) menu.style.display = 'none';
  }
});

// --------------------------------------------
//   HOME EDITOR
// --------------------------------------------
function populateHomeEditor() {
  const sel = document.getElementById('heroPickSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Anime --</option>';
  animeLibrary.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id; opt.textContent = a.title;
    if (a.id === featuredHeroId) opt.selected = true;
    sel.appendChild(opt);
  });
  ['trending','topRated','recent','series','movies'].forEach(key => {
    const cb = document.getElementById('toggle_' + key);
    const ti = document.getElementById('rowTitle_' + key);
    if (cb) cb.checked = rowSettings[key].visible;
    if (ti) ti.value = rowSettings[key].title;
  });
  updateHeroPreview();
}

function setFeaturedHero(id) {
  featuredHeroId = id;
  localStorage.setItem('myanime_hero', id);
  updateHeroPreview(); renderHero();
}

function updateHeroPreview() {
  const card = document.getElementById('heroPreviewCard');
  if (!card) return;
  const anime = animeLibrary.find(a => a.id === featuredHeroId);
  if (!anime) { card.innerHTML = ''; return; }
  card.innerHTML = `<div class="hero-preview-mini">
    <div class="mini-emoji">${anime.emoji||'??'}</div>
    <div><strong>${anime.title}</strong><span>${anime.year||''} � ${anime.type} � ${anime.genre||''}</span></div>
  </div>`;
}

// --------------------------------------------
//   RECOMMENDATIONS
// --------------------------------------------
function populateRecommendations() {
  renderRecommendGrid('trendingManager', 'trending');
  renderRecommendGrid('topRatedManager', 'topRated');
}

function renderRecommendGrid(containerId, field) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  animeLibrary.forEach(anime => {
    const item = document.createElement('div');
    item.className = 'recommend-item' + (anime[field] ? ' selected' : '');
    item.innerHTML = `
      <input type="checkbox" id="rec_${field}_${anime.id}" ${anime[field]?'checked':''}
        onchange="toggleRecommend('${field}','${anime.id}',this)"/>
      <div class="recommend-item-info">
        <strong>${anime.emoji||'??'} ${anime.title}</strong>
        <span>${anime.type} � ${anime.year||''}</span>
      </div>`;
    item.onclick = e => { if (e.target.tagName !== 'INPUT') item.querySelector('input').click(); };
    container.appendChild(item);
  });
}

function toggleRecommend(field, id, cb) {
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime) return;
  anime[field] = cb.checked;
  cb.closest('.recommend-item').classList.toggle('selected', cb.checked);
}

function saveRecommendations() {
  saveToStorage(); renderRows();
  showToast('? Recommendations saved!');
}

// --------------------------------------------
//   THEME MANAGER
// --------------------------------------------
const THEMES = {
  netflix: { red:'#e50914', dark:'#141414', dark2:'#1a1a1a', dark3:'#222',    dark4:'#2a2a2a', card:'#181818' },
  ocean:   { red:'#0066ff', dark:'#050d1a', dark2:'#071220', dark3:'#0a1828', dark4:'#0d1e30', card:'#081525' },
  forest:  { red:'#00aa44', dark:'#050f08', dark2:'#071410', dark3:'#091a12', dark4:'#0b2016', card:'#07120e' },
  purple:  { red:'#9b59b6', dark:'#0d0814', dark2:'#130c1a', dark3:'#181020', dark4:'#1e1428', card:'#110a18' },
  gold:    { red:'#f0a500', dark:'#140f00', dark2:'#1a1400', dark3:'#201900', dark4:'#271e00', card:'#1a1200' },
  sakura:  { red:'#ff6b9d', dark:'#140810', dark2:'#1a0c16', dark3:'#20101c', dark4:'#261422', card:'#180a14' },
};

function applyThemePreset(name) {
  const t = THEMES[name]; if (!t) return;
  const vars = { '--red':t.red, '--red-hover':t.red, '--dark':t.dark, '--dark2':t.dark2, '--dark3':t.dark3, '--dark4':t.dark4, '--card-bg':t.card };
  Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k, v));
  document.body.style.background = t.dark;
  document.querySelectorAll('.theme-preset').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-theme="${name}"]`)?.classList.add('active');
  [['accentColor',t.red],['bgColor',t.dark],['cardColor',t.card]].forEach(([id, val]) => {
    const el = document.getElementById(id); if (el) el.value = val;
  });
  const hEl = document.getElementById('accentHex'); if (hEl) hEl.textContent = t.red;
  const bEl = document.getElementById('bgHex');     if (bEl) bEl.textContent = t.dark;
  const cEl = document.getElementById('cardHex');   if (cEl) cEl.textContent = t.card;
  localStorage.setItem('myanime_theme', JSON.stringify({ name, ...t }));
  showToast(`? Theme: ${name}`);
}

function applyCustomColor() {
  const accent = document.getElementById('accentColor').value;
  const bg     = document.getElementById('bgColor').value;
  const card   = document.getElementById('cardColor').value;
  document.documentElement.style.setProperty('--red',     accent);
  document.documentElement.style.setProperty('--dark',    bg);
  document.documentElement.style.setProperty('--card-bg', card);
  document.body.style.background = bg;
  document.getElementById('accentHex').textContent = accent;
  document.getElementById('bgHex').textContent     = bg;
  document.getElementById('cardHex').textContent   = card;
  document.querySelectorAll('.theme-preset').forEach(p => p.classList.remove('active'));
  localStorage.setItem('myanime_theme', JSON.stringify({ name:'custom', red:accent, dark:bg, card }));
}

function applyBranding() {
  const title = document.getElementById('siteTitle').value.trim();
  const icon  = document.getElementById('siteIcon').value.trim();
  if (title) { document.querySelector('.logo-text').textContent = title; document.title = title; }
  if (icon)  document.querySelector('.logo-icon').textContent = icon;
  localStorage.setItem('myanime_branding', JSON.stringify({ title, icon }));
}

function applyEffects() {
  const hover      = document.getElementById('effect_hover').checked;
  const transition = document.getElementById('effect_transition').checked;
  const style = document.getElementById('dynamicEffects') || (() => {
    const s = document.createElement('style'); s.id = 'dynamicEffects'; document.head.appendChild(s); return s;
  })();
  style.textContent = `
    ${!hover      ? '.anime-card:hover { transform: none !important; }' : ''}
    ${!transition ? '.page { animation: none !important; }' : ''}
  `;
  localStorage.setItem('myanime_effects', JSON.stringify({ hover, transition }));
}

function resetTheme() {
  applyThemePreset('netflix');
  document.querySelector('.logo-text').textContent = 'MyAnime';
  document.querySelector('.logo-icon').textContent = '??';
  document.title = 'MyAnime';
  document.getElementById('siteTitle').value = '';
  document.getElementById('siteIcon').value  = '';
  localStorage.removeItem('myanime_theme');
  localStorage.removeItem('myanime_branding');
  showToast('? Theme reset to default');
}

function loadSavedTheme() {
  try {
    const t = localStorage.getItem('myanime_theme');
    const b = localStorage.getItem('myanime_branding');
    const e = localStorage.getItem('myanime_effects');
    if (t) {
      const theme = JSON.parse(t);
      if (theme.name && THEMES[theme.name]) applyThemePreset(theme.name);
      else {
        document.documentElement.style.setProperty('--red',     theme.red  || '#e50914');
        document.documentElement.style.setProperty('--dark',    theme.dark || '#141414');
        document.documentElement.style.setProperty('--card-bg', theme.card || '#181818');
      }
    }
    if (b) {
      const brand = JSON.parse(b);
      if (brand.title) { document.querySelector('.logo-text').textContent = brand.title; document.title = brand.title; }
      if (brand.icon)  document.querySelector('.logo-icon').textContent = brand.icon;
    }
    if (e) {
      const eff = JSON.parse(e);
      document.getElementById('effect_hover').checked      = eff.hover !== false;
      document.getElementById('effect_transition').checked = eff.transition !== false;
      applyEffects();
    }
  } catch(err) {}
}

// --------------------------------------------
//   SITE EDITOR
// --------------------------------------------
function getSiteEdits() {
  try { const s = localStorage.getItem('myanime_siteedits'); return s ? JSON.parse(s) : {}; } catch(e) { return {}; }
}

function saveSiteEdits(edits) { localStorage.setItem('myanime_siteedits', JSON.stringify(edits)); }

function populateSiteEditorFields() {
  const e = getSiteEdits();
  ['siteName','logoEmoji','nav1','nav2','nav3','nav4','heroBadge','heroTagline','playBtn','infoBtn',
   'moviesTitle','seriesTitle','mylistTitle','searchTitle','searchPlaceholder','bannerText','footerText','emptyList','noResults']
    .forEach(key => { const el = document.getElementById('edit_' + key); if (el) el.value = e[key] || ''; });
  const bEn  = document.getElementById('edit_bannerEnabled'); if (bEn)  bEn.checked = e.bannerEnabled || false;
  const bBg  = document.getElementById('edit_bannerBg');      if (bBg)  bBg.value   = e.bannerBg  || '#e50914';
  const bCol = document.getElementById('edit_bannerColor');   if (bCol) bCol.value  = e.bannerColor || '#ffffff';
}

function collectSiteEdits() {
  const g = id => document.getElementById(id)?.value || '';
  return {
    siteName: g('edit_siteName'), logoEmoji: g('edit_logoEmoji'),
    nav1: g('edit_nav1'), nav2: g('edit_nav2'), nav3: g('edit_nav3'), nav4: g('edit_nav4'),
    heroBadge: g('edit_heroBadge'), heroTagline: g('edit_heroTagline'),
    playBtn: g('edit_playBtn'), infoBtn: g('edit_infoBtn'),
    moviesTitle: g('edit_moviesTitle'), seriesTitle: g('edit_seriesTitle'),
    mylistTitle: g('edit_mylistTitle'), searchTitle: g('edit_searchTitle'),
    searchPlaceholder: g('edit_searchPlaceholder'),
    bannerEnabled: document.getElementById('edit_bannerEnabled')?.checked || false,
    bannerText: g('edit_bannerText'),
    bannerBg:    document.getElementById('edit_bannerBg')?.value    || '#e50914',
    bannerColor: document.getElementById('edit_bannerColor')?.value || '#ffffff',
    footerText: g('edit_footerText'), emptyList: g('edit_emptyList'), noResults: g('edit_noResults'),
  };
}

function applyAllSiteEdits(e) {
  if (!e) e = getSiteEdits();
  if (e.siteName) { document.querySelector('.logo-text').textContent = e.siteName; document.title = e.siteName; }
  if (e.logoEmoji) document.querySelector('.logo-icon').textContent = e.logoEmoji;
  const navLinks = document.querySelectorAll('.nav-link');
  [e.nav1, e.nav2, e.nav3, e.nav4].forEach((text, i) => { if (text && navLinks[i]) navLinks[i].textContent = text; });
  const badge = document.querySelector('.hero-badge');
  if (badge && e.heroBadge) badge.textContent = e.heroBadge;
  document.querySelectorAll('.hero-buttons .btn-play').forEach(b => { if (e.playBtn) b.textContent = e.playBtn; });
  document.querySelectorAll('.hero-buttons .btn-info').forEach(b => { if (e.infoBtn) b.textContent = e.infoBtn; });
  [['moviesTitle','#moviesPage .browse-title'],['seriesTitle','#seriesPage .browse-title'],['mylistTitle','#mylistPage .browse-title']]
    .forEach(([key, sel]) => { const el = document.querySelector(sel); if (el && e[key]) el.textContent = e[key]; });
  const sp = document.getElementById('searchInput');
  if (sp && e.searchPlaceholder) sp.placeholder = e.searchPlaceholder;
  const banner = document.getElementById('announcementBanner');
  if (banner) {
    if (e.bannerEnabled && e.bannerText) {
      banner.style.display = 'block'; banner.textContent = e.bannerText;
      banner.style.background = e.bannerBg || '#e50914'; banner.style.color = e.bannerColor || '#fff';
    } else { banner.style.display = 'none'; }
  }
}

function liveEditSite()       { const e = collectSiteEdits(); if (e.siteName) { document.querySelector('.logo-text').textContent = e.siteName; document.title = e.siteName; } if (e.logoEmoji) document.querySelector('.logo-icon').textContent = e.logoEmoji; }
function liveEditNav()        { const navLinks = document.querySelectorAll('.nav-link'); [1,2,3,4].map(n => document.getElementById('edit_nav'+n)?.value).forEach((v,i) => { if (v && navLinks[i]) navLinks[i].textContent = v; }); }
function liveEditHero()       { const badge = document.querySelector('.hero-badge'); const val = document.getElementById('edit_heroBadge')?.value; if (badge && val) badge.textContent = val; const pb = document.getElementById('edit_playBtn')?.value; const ib = document.getElementById('edit_infoBtn')?.value; document.querySelectorAll('.hero-buttons .btn-play').forEach(b => { if (pb) b.textContent = pb; }); document.querySelectorAll('.hero-buttons .btn-info').forEach(b => { if (ib) b.textContent = ib; }); }
function liveEditPageTitles() { [['edit_moviesTitle','#moviesPage .browse-title'],['edit_seriesTitle','#seriesPage .browse-title'],['edit_mylistTitle','#mylistPage .browse-title']].forEach(([inputId, sel]) => { const v = document.getElementById(inputId)?.value; const el = document.querySelector(sel); if (el && v) el.textContent = v; }); }
function liveEditSearch()     { const v = document.getElementById('edit_searchPlaceholder')?.value; const sp = document.getElementById('searchInput'); if (sp && v) sp.placeholder = v; }
function liveEditBanner()     { const enabled = document.getElementById('edit_bannerEnabled')?.checked; const text = document.getElementById('edit_bannerText')?.value; const bg = document.getElementById('edit_bannerBg')?.value; const col = document.getElementById('edit_bannerColor')?.value; const banner = document.getElementById('announcementBanner'); if (banner) { if (enabled && text) { banner.style.display = 'block'; banner.textContent = text; banner.style.background = bg; banner.style.color = col; } else { banner.style.display = 'none'; } } }
function liveEditFooter()      {}
function liveEditEmptyStates() {}

function saveAllSiteEdits() { const e = collectSiteEdits(); saveSiteEdits(e); applyAllSiteEdits(e); showToast('?? Site edits saved!'); }

function resetSiteEdits() {
  if (!confirm('Reset all site text edits to defaults?')) return;
  localStorage.removeItem('myanime_siteedits');
  applyAllSiteEdits({}); populateSiteEditorFields();
  document.querySelector('.logo-text').textContent = 'MyAnime';
  document.querySelector('.logo-icon').textContent = '??';
  document.title = 'MyAnime';
  document.getElementById('announcementBanner').style.display = 'none';
  showToast('? Site edits reset.');
}

function loadSiteEdits() {
  const e = getSiteEdits();
  if (Object.keys(e).length > 0) applyAllSiteEdits(e);
}

// --------------------------------------------
//   ADMIN TABS
// --------------------------------------------
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const tabEl = document.getElementById(tab + 'Tab');
  if (tabEl) tabEl.classList.add('active');
  if (tab === 'analytics') refreshAnalytics();
  if (tab === 'home')      populateHomeEditor();
  if (tab === 'recommend') populateRecommendations();
  if (tab === 'security')  { renderLoginHistory(); loadSecuritySettings(); }
}

// --------------------------------------------
//   LIBRARY / FILE UPLOAD
// --------------------------------------------
function handleFileSelect(event, type) {
  const file = event.target.files[0]; if (file) handleFile(file, type);
}

function handleDrop(event, type) {
  event.preventDefault();
  const zone = type === 'video' ? document.getElementById('dropZone') : document.getElementById('thumbZone');
  zone.classList.remove('drag-over');
  const file = event.dataTransfer.files[0]; if (file) handleFile(file, type);
}

function handleFile(file, type) {
  if (type === 'video') {
    simulateUpload(file);
  } else if (type === 'thumb') {
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('thumbPreview');
      const icon    = document.getElementById('thumbPreviewIcon');
      preview.src = e.target.result; preview.style.display = 'block'; icon.style.display = 'none';
      uploadedThumbBlob = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function simulateUpload(file) {
  const progress = document.getElementById('videoProgress');
  const fill     = document.getElementById('videoFill');
  const percent  = document.getElementById('videoPercent');
  progress.style.display = 'block';
  const reader = new FileReader();
  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + Math.random() * 12, 95);
    fill.style.width = pct + '%'; percent.textContent = Math.round(pct) + '%';
  }, 150);
  reader.onload = e => {
    clearInterval(interval);
    fill.style.width = '100%'; percent.textContent = '100% ?';
    uploadedVideoBlob = e.target.result;
    showToast('? Video loaded! Fill in details and click Add to Library.');
  };
  reader.readAsDataURL(file);
}

// --------------------------------------------
//   LIBRARY / Edit / Delete
// --------------------------------------------
function renderLibraryTab() {
  const grid  = document.getElementById('libraryGrid');
  const count = document.getElementById('libraryCount');
  if (!grid) return;
  count.textContent = animeLibrary.length;
  grid.innerHTML = '';
  animeLibrary.forEach(anime => {
    const item = document.createElement('div');
    item.className = 'library-item';
    const thumbHtml = hasValidThumb(anime)
      ? `<img class="library-thumb" src="${anime.thumb}" alt="${anime.title}"/>`
      : `<div class="library-thumb-placeholder">${anime.emoji||'??'}</div>`;
    item.innerHTML = `
      ${thumbHtml}
      <div class="library-info">
        <strong>${anime.title}</strong>
        <span>${anime.type} � ${anime.year||'N/A'} � ${anime.genre||''}</span>
        <span style="color:${anime.videoUrl?'#4caf50':'#e57373'};font-size:0.7rem">
          ${anime.videoUrl ? '? Has video source' : '?? No video source'}
        </span>
      </div>
      <div class="library-actions">
        <button class="lib-btn edit" onclick="openEditModal('${anime.id}')">??</button>
        <button class="lib-btn" onclick="goToWatch(animeLibrary.find(a=>a.id==='${anime.id}'),0)">?</button>
        <button class="lib-btn del" onclick="deleteAnime('${anime.id}')">???</button>
      </div>`;
    grid.appendChild(item);
  });
}

function openEditModal(id) {
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime) return;
  editThumbBlob = null;
  document.getElementById('editAnimeId').value   = id;
  document.getElementById('editTitle').value     = anime.title    || '';
  document.getElementById('editDesc').value      = anime.desc     || '';
  document.getElementById('editType').value      = anime.type     || 'series';
  document.getElementById('editYear').value      = anime.year     || '';
  document.getElementById('editGenre').value     = anime.genre    || 'action';
  document.getElementById('editRating').value    = anime.rating   || '';
  document.getElementById('editVideoUrl').value  = anime.videoUrl || '';
  const prev = document.getElementById('editThumbPreview');
  if (hasValidThumb(anime)) { prev.src = anime.thumb; prev.style.display = 'block'; }
  else { prev.style.display = 'none'; }
  document.getElementById('editAnimeModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('editAnimeModal').classList.remove('active');
  document.body.style.overflow = '';
}

function previewEditThumb(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    editThumbBlob = e.target.result;
    const prev = document.getElementById('editThumbPreview');
    prev.src = editThumbBlob; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function saveAnimeEdit() {
  const id = document.getElementById('editAnimeId').value;
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime) return;
  anime.title    = document.getElementById('editTitle').value.trim() || anime.title;
  anime.desc     = document.getElementById('editDesc').value.trim();
  anime.type     = document.getElementById('editType').value;
  anime.year     = document.getElementById('editYear').value;
  anime.genre    = document.getElementById('editGenre').value;
  anime.rating   = document.getElementById('editRating').value;
  anime.videoUrl = document.getElementById('editVideoUrl').value.trim();
  if (editThumbBlob) anime.thumb = editThumbBlob;
  try {
    await fetch(`${API}/admin/anime/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        title: anime.title, description: anime.desc, type: anime.type,
        year: parseInt(anime.year), genre: [anime.genre], rating: anime.rating,
        videoUrl: anime.videoUrl, thumbnailUrl: anime.thumb
      })
    });
  } catch(err) { console.log('Backend save failed:', err.message); }
  saveToStorage(); renderAll(); closeEditModal();
  showToast(`? "${anime.title}" updated!`);
}

async function deleteAnime(id) {
  const anime = animeLibrary.find(a => a.id === id);
  if (!anime || !confirm(`Delete "${anime.title}"?`)) return;
  try {
    const res = await fetch(`${API}/anime/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) { showToast(`? Backend delete failed: ${data.message}`); return; }
  } catch (err) {
    showToast('? Could not reach server. Anime NOT deleted.');
    return;
  }
  animeLibrary = animeLibrary.filter(a => a.id !== id);
  myList       = myList.filter(m => m.id !== id);
  saveToStorage(); renderAll();
  showToast(`??? "${anime.title}" deleted from site and database!`);
}

function clearLibrary() {
  if (!confirm('Clear entire library? Demo data will reload on refresh.')) return;
  animeLibrary = [...DEMO_ANIME]; myList = [];
  saveToStorage(); renderAll();
  showToast('Library reset to demo data.');
}

// --------------------------------------------
//   CLOUD GUIDE
// --------------------------------------------
function showCloudGuide(provider) {
  const guides = {
    gdrive:     { title:'?? Google Drive Setup',  steps:[{title:'Upload your video',desc:'Go to drive.google.com and upload your video file.'},{title:'Make it public',desc:'Right-click ? Share ? Change to "Anyone with the link ? Viewer".'},{title:'Get the File ID',desc:'Copy the ID from the URL: drive.google.com/file/d/<strong>FILE_ID</strong>/view',code:'https://drive.google.com/uc?export=download&id=FILE_ID'},{title:'Use the direct URL',desc:'Replace FILE_ID with your actual file ID and paste it in the Cloud Video URL field.'}]},
    s3:         { title:'?? Amazon S3 Setup',      steps:[{title:'Create an S3 bucket',desc:'Go to AWS Console ? S3 ? Create Bucket. Uncheck "Block all public access".'},{title:'Upload your video',desc:'Upload your video file and make it publicly accessible.'},{title:'Get the URL',desc:'Click the file ? Copy the Object URL.',code:'https://your-bucket.s3.amazonaws.com/video.mp4'}]},
    cloudinary: { title:'?? Cloudinary Setup',     steps:[{title:'Create free account',desc:'Sign up at cloudinary.com � free tier supports up to 25GB.'},{title:'Upload video',desc:'Go to Media Library ? Upload your video file.'},{title:'Get the URL',desc:'Click your video ? Copy the URL from "Link"',code:'https://res.cloudinary.com/YOUR_CLOUD/video/upload/v.../video.mp4'}]},
    backblaze:  { title:'?? Backblaze B2 Setup',   steps:[{title:'Create account',desc:'Sign up at backblaze.com/b2 � free 10GB storage.'},{title:'Create bucket',desc:'Create a new bucket and set it to "Public".'},{title:'Upload & get URL',desc:'Upload video ? click file ? "Friendly URL"',code:'https://f000.backblazeb2.com/file/bucket/video.mp4'}]},
    wasabi:     { title:'?? Wasabi Setup',          steps:[{title:'Create account',desc:'Sign up at wasabi.com � $6.99/TB storage, no egress fees.'},{title:'Create bucket',desc:'Create a new bucket with public read policy.'},{title:'Get URL',desc:'Upload video and use the public endpoint URL.',code:'https://s3.wasabisys.com/your-bucket/video.mp4'}]},
    jiocloud:   { title:'???? Jio Cloud Setup',     steps:[{title:'Open JioCloud on your phone or PC',desc:'Download the JioCloud app or go to <strong>jiocloud.com</strong> and sign in with your Jio number.'},{title:'Upload your video',desc:'Tap the + button ? Upload ? select your video file (MP4 recommended).'},{title:'Share the file',desc:'Long-press the video file ? tap <strong>Share</strong> ? select <strong>Share Link</strong>. Make sure it is set to <strong>"Anyone with the link"</strong>.'},{title:'Get the direct link',desc:'Copy the shared link. It will look like:',code:'https://www.jiocloud.com/s/xxxxxxxxxx'},{title:'Paste into MyAnime',desc:'Go to Admin ? Upload tab ? paste the link in the <strong>Cloud Video URL</strong> field.'},{title:'Tip � Better streaming',desc:'For the smoothest playback, re-upload to <strong>Cloudinary (free 25GB)</strong> which offers proper video streaming support.'}]},
  };
  const guide = guides[provider]; if (!guide) return;
  document.getElementById('guideTitle').textContent = guide.title;
  document.getElementById('guideContent').innerHTML = guide.steps.map((s, i) =>
    `<div class="step"><strong>${i+1}. ${s.title}</strong><p>${s.desc}</p>${s.code ? `<code>${s.code}</code>` : ''}</div>`
  ).join('');
  document.getElementById('cloudGuideModal').classList.add('active');
}

function closeCloudGuide() { document.getElementById('cloudGuideModal').classList.remove('active'); }

function testVideoUrl() {
  const url = document.getElementById('testUrl').value.trim();
  if (!url) { showToast('?? Enter a URL to test'); return; }
  const player = document.getElementById('testPlayer');
  player.src = url; player.style.display = 'block'; player.load();
  player.oncanplay = () => showToast('? Video URL works!');
  player.onerror   = () => showToast('? Cannot load video. Check URL & CORS settings.');
}

function convertGDriveUrl() {
  const url   = document.getElementById('gdriveInput').value.trim();
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const result = document.getElementById('gdriveResult');
  if (!match) { showToast('?? Invalid Google Drive URL format.'); return; }
  const fileId    = match[1];
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  result.style.display = 'block';
  result.innerHTML = `
    <p>? Direct stream URL:</p>
    <code>${directUrl}</code>
    <p style="margin-top:0.5rem;color:#e57373;font-size:0.78rem">?? Note: Google Drive may block large video streaming due to CORS. Cloudinary or S3 work better.</p>
    <button class="copy-url-btn" onclick="navigator.clipboard.writeText('${directUrl}');showToast('Copied!')">?? Copy URL</button>`;
}

// --------------------------------------------
//   USER AUTH
// --------------------------------------------
function openUserAuth()  { document.getElementById('userAuthModal').classList.add('active');    document.body.style.overflow = 'hidden'; }
function closeUserAuth() { document.getElementById('userAuthModal').classList.remove('active'); document.body.style.overflow = ''; }

function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tabLoginBtn').className    = tab === 'login'  ? 'btn-play' : 'btn-info';
  document.getElementById('tabSignupBtn').className   = tab === 'signup' ? 'btn-play' : 'btn-info';
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill all fields.'; errEl.style.display = 'block'; return; }
  try {
    const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.success) {
      setToken(data.accessToken); setUser(data.user);
      closeUserAuth(); updateNavForAuth();
      showToast(`? Welcome back, ${data.user.username}!`);
    } else { errEl.textContent = data.message; errEl.style.display = 'block'; }
  } catch(e) { errEl.textContent = 'Connection error. Is server running?'; errEl.style.display = 'block'; }
}

async function handleSignup() {
  const username = document.getElementById('signupUsername').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errEl    = document.getElementById('signupError');
  errEl.style.display = 'none';
  if (!username || !email || !password) { errEl.textContent = 'Please fill all fields.'; errEl.style.display = 'block'; return; }
  try {
    const res  = await fetch(`${API}/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, email, password }) });
    const data = await res.json();
    if (data.success) { closeUserAuth(); showToast('? Account created! You can now log in.'); }
    else { errEl.textContent = data.message; errEl.style.display = 'block'; }
  } catch(e) { errEl.textContent = 'Connection error. Is server running?'; errEl.style.display = 'block'; }
}

function updateNavForAuth() {
  const user     = getUser();
  const loginBtn = document.getElementById('loginBtn');
  const avatar   = document.getElementById('userAvatar');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (avatar) { avatar.style.display = 'flex'; avatar.textContent = user.username[0].toUpperCase(); }
    if (user.role === 'admin') document.getElementById('adminBtn').style.display = 'flex';
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (avatar)   avatar.style.display = 'none';
  }
}

// --------------------------------------------
//   TOAST
// --------------------------------------------
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// --------------------------------------------
//   START
// --------------------------------------------
document.addEventListener('DOMContentLoaded', init);






// -- Mobile Search Page Functions -----------------------------
function mspSearch(q) {
  const grid    = document.getElementById('mspGrid');
  const results = document.getElementById('mspResults');
  if (!grid || !results) return;
  if (!q || q.length < 2) {
    grid.style.display    = 'none';
    results.style.display = 'block';
    return;
  }
  const filtered = animeLibrary.filter(a =>
    a.title.toLowerCase().includes(q.toLowerCase()) ||
    (a.genre && a.genre.toLowerCase().includes(q.toLowerCase()))
  );
  results.style.display = 'none';
  grid.style.display    = 'block';
  renderGrid('mspGrid', filtered);
}

function mspClear() {
  const input = document.getElementById('mspInput');
  if (input) { input.value = ''; }
  mspSearch('');
}

function mspFill(text) {
  const input = document.getElementById('mspInput');
  if (input) { input.value = text; mspSearch(text); }
}

function mspPopulateTrending() {
  const list = document.getElementById('mspTrending');
  if (!list) return;
  const trending = animeLibrary.filter(a => a.trending).slice(0, 5);
  list.innerHTML = trending.map(a =>
    `<div class="msp-list-item" onclick="mspFill(${JSON.stringify(a.title)})">${a.emoji||"??"} ${a.title}</div>`
  ).join('');
}

