/* ────────────────────────────────────────────────────────
   匠 Takumi Player — app.js
   Handles: library, playlists, playback, shuffle, repeat
──────────────────────────────────────────────────────── */

// ── Sound System ────────────────────────────────────────
const clickSound = new Audio('./assets/sounds/click.wav');
clickSound.volume = 0.35;

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {}); // silence any autoplay errors
}

// ── State ───────────────────────────────────────────────
let allTracks = [];        // full scanned library
let filteredTracks = [];   // after search filter
let playlists = [];        // [{id, name, tracks:[id,...]}]
let currentPlaylistId = null;

let queue = [];            // current play queue (track objects)
let queueIndex = -1;
let isShuffled = false;
let repeatMode = 0;        // 0=off 1=all 2=one
let isDraggingProgress = false;

const audio = document.getElementById('audio');

// ── DOM refs ────────────────────────────────────────────
const $ = id => document.getElementById(id);
const trackList    = $('track-list');
const playerBar    = $('player-bar');
const playerDisc   = $('player-disc');
const playerTitle  = $('player-title');
const playerSub    = $('player-sub');
const progressFill = $('progress-fill');
const progressThumb= $('progress-thumb');
const progressBar  = $('progress-bar');
const timeCurrent  = $('time-current');
const timeTotal    = $('time-total');
const btnPlay      = $('btn-play');
const iconPlay     = $('icon-play');
const iconPause    = $('icon-pause');
const btnShuffle   = $('btn-shuffle');
const btnRepeat    = $('btn-repeat');
const searchInput  = $('search-input');
const folderLabel  = $('folder-label');
const statTracks   = $('stat-tracks');
const overlayWelcome=$('overlay-welcome');
const appEl        = $('app');
const contextMenu  = document.createElement('div');
contextMenu.id = 'context-menu';
document.body.appendChild(contextMenu);

// ── Init ────────────────────────────────────────────────
async function init() {
  playlists = (await window.takumi.getPlaylists()) || [];

  window.takumi.onPromptFolderSelect(() => {
    overlayWelcome.classList.remove('hidden');
  });
  window.takumi.onMusicFolderLoaded((folder) => {
    folderLabel.textContent = folder;
    folderLabel.title = folder;
  });
  window.takumi.onTracksLoaded((tracks) => {
    allTracks = tracks;
    filteredTracks = [...tracks];
    statTracks.textContent = `${tracks.length} track${tracks.length !== 1 ? 's' : ''}`;
    renderTrackList();
    appEl.classList.remove('hidden');
    overlayWelcome.classList.add('hidden');
  });

  setupControls();
  setupNav();
  setupAudio();
  setupProgressBar();
  setupVolume();
  setupSearch();
  setupContextMenu();
  renderPlaylists();
}

// ── Folder Select ───────────────────────────────────────
$('btn-select-folder').addEventListener('click', async () => {
  const result = await window.takumi.selectMusicFolder();
  if (!result) return;
  folderLabel.textContent = result.folderPath;
  folderLabel.title = result.folderPath;
});

$('btn-change-folder').addEventListener('click', async () => {
  const result = await window.takumi.changeMusicFolder();
  if (!result) return;
  folderLabel.textContent = result.folderPath;
  folderLabel.title = result.folderPath;
});

$('btn-refresh-folder').addEventListener('click', async () => {
  playClick();
  const btn = $('btn-refresh-folder');
  btn.textContent = '↺ Scanning…';
  btn.disabled = true;
  const result = await window.takumi.rescanFolder();
  btn.textContent = '↺ Refresh';
  btn.disabled = false;
  if (!result) return;
  folderLabel.textContent = result.folderPath;
  folderLabel.title = result.folderPath;
});

// ── Track List Rendering ────────────────────────────────
function renderTrackList(tracks = filteredTracks) {
  trackList.innerHTML = '';
  $('track-empty').classList.toggle('hidden', tracks.length > 0);
  tracks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'track-row' + (isPlaying(t) ? ' playing' : '');
    row.dataset.id = t.id;
    row.innerHTML = `
      <span class="col-num">${isPlaying(t)
        ? `<span class="playing-indicator"><span></span><span></span><span></span></span>`
        : i + 1}</span>
      <span class="col-title">${escHtml(t.title)}</span>
      <span class="col-folder">${escHtml(t.folder)}</span>
      <span class="col-ext"><span>${escHtml(t.ext)}</span></span>
    `;
    row.addEventListener('dblclick', () => { playClick(); playTrack(t, tracks); });
    row.addEventListener('contextmenu', (e) => showContextMenu(e, t, tracks));
    trackList.appendChild(row);
  });
}

function isPlaying(t) {
  return queue[queueIndex]?.id === t.id && !audio.paused;
}

function refreshPlayingHighlight() {
  document.querySelectorAll('.track-row').forEach((row, i) => {
    const id = row.dataset.id;
    const playing = queue[queueIndex]?.id === id;
    row.classList.toggle('playing', playing);
    const numEl = row.querySelector('.col-num');
    if (playing) {
      numEl.innerHTML = `<span class="playing-indicator"><span></span><span></span><span></span></span>`;
    } else {
      numEl.textContent = i + 1;
    }
  });
}

// ── Playback ────────────────────────────────────────────
function playTrack(track, sourceList) {
  queue = [...sourceList];
  if (isShuffled) shuffleQueue(track);
  queueIndex = queue.findIndex(t => t.id === track.id);
  loadAndPlay();
}

function loadAndPlay() {
  const t = queue[queueIndex];
  if (!t) return;
  audio.src = `file://${t.path}`;
  audio.play();
  playerBar.classList.remove('hidden');
  playerTitle.textContent = t.title;
  playerSub.textContent = t.ext + ' · Takumi Player';
  playerDisc.classList.add('playing');
  iconPlay.classList.add('hidden');
  iconPause.classList.remove('hidden');
  refreshPlayingHighlight();
}

function shuffleQueue(currentTrack) {
  const others = queue.filter(t => t.id !== currentTrack?.id);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  queue = currentTrack ? [currentTrack, ...others] : others;
}

// ── Controls ─────────────────────────────────────────────
function setupControls() {
  btnPlay.addEventListener('click', () => { playClick(); togglePlay(); });
  $('btn-prev').addEventListener('click', () => { playClick(); prevTrack(); });
  $('btn-next').addEventListener('click', () => { playClick(); nextTrack(); });

  btnShuffle.addEventListener('click', () => {
    playClick();
    isShuffled = !isShuffled;
    btnShuffle.classList.toggle('active', isShuffled);
    if (isShuffled && queue.length > 1) {
      const cur = queue[queueIndex];
      shuffleQueue(cur);
      queueIndex = 0;
    }
  });

  btnRepeat.addEventListener('click', () => {
    playClick();
    repeatMode = (repeatMode + 1) % 3;
    btnRepeat.classList.toggle('active', repeatMode > 0);
    btnRepeat.style.opacity = repeatMode === 0 ? '' : '1';
    btnRepeat.title = ['Repeat: Off', 'Repeat: All', 'Repeat: One'][repeatMode];
  });
}

function togglePlay() {
  if (!queue.length) return;
  if (audio.paused) {
    audio.play();
    playerDisc.classList.add('playing');
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    audio.pause();
    playerDisc.classList.remove('playing');
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }
}

function nextTrack() {
  if (!queue.length) return;
  if (repeatMode === 2) { audio.currentTime = 0; audio.play(); return; }
  queueIndex++;
  if (queueIndex >= queue.length) {
    if (repeatMode === 1) queueIndex = 0;
    else { queueIndex = queue.length - 1; return; }
  }
  loadAndPlay();
}

function prevTrack() {
  if (!queue.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  queueIndex--;
  if (queueIndex < 0) queueIndex = 0;
  loadAndPlay();
}

// ── Audio Events ─────────────────────────────────────────
function setupAudio() {
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('pause', () => {
    playerDisc.classList.remove('playing');
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  });
  audio.addEventListener('play', () => {
    playerDisc.classList.add('playing');
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    refreshPlayingHighlight();
  });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });
  audio.volume = 0.8;
}

function updateProgress() {
  if (isDraggingProgress || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  timeCurrent.textContent = formatTime(audio.currentTime);
}

// ── Progress Bar ─────────────────────────────────────────
function setupProgressBar() {
  function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left = (pct * 100) + '%';
    timeCurrent.textContent = formatTime(pct * (audio.duration || 0));
    if (audio.duration) audio.currentTime = pct * audio.duration;
  }
  progressBar.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    document.body.style.userSelect = 'none';
    seek(e);
    const up = () => {
      isDraggingProgress = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mouseup', up);
      document.removeEventListener('mousemove', move);
    };
    const move = (ev) => seek(ev);
    document.addEventListener('mouseup', up);
    document.addEventListener('mousemove', move);
  });
}

// ── Volume ────────────────────────────────────────────────
function setupVolume() {
  const bar   = $('volume-bar');
  const fill  = $('volume-fill');
  const thumb = $('volume-thumb');
  let vol = 0.8;

  function setVolume(pct) {
    vol = Math.max(0, Math.min(1, pct));
    audio.volume = vol;
    fill.style.width  = (vol * 100) + '%';
    thumb.style.left  = (vol * 100) + '%';
  }

  function dragVolume(e) {
    const rect = bar.getBoundingClientRect();
    setVolume((e.clientX - rect.left) / rect.width);
  }

  // initialise visual
  setVolume(0.8);

  bar.addEventListener('mousedown', (e) => {
    document.body.style.userSelect = 'none';
    dragVolume(e);
    const move = (ev) => dragVolume(ev);
    const up   = () => {
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',   up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   up);
  });

  // scroll wheel on volume bar
  bar.addEventListener('wheel', (e) => {
    e.preventDefault();
    setVolume(vol - e.deltaY * 0.001);
  }, { passive: false });
}

// ── Search ────────────────────────────────────────────────
function setupSearch() {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    filteredTracks = q
      ? allTracks.filter(t => t.title.toLowerCase().includes(q) || t.folder.toLowerCase().includes(q))
      : [...allTracks];
    renderTrackList();
  });
}

// ── Navigation ────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      $(`view-${view}`).classList.remove('hidden');
      if (view === 'playlists') renderPlaylists();
    });
  });
}

// ── Context Menu ──────────────────────────────────────────
function setupContextMenu() {
  document.addEventListener('click', () => hideContextMenu());
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('#context-menu')) hideContextMenu(); });
}

function showContextMenu(e, track, sourceList) {
  e.preventDefault();
  e.stopPropagation();
  contextMenu.innerHTML = `
    <div class="ctx-item" data-action="play">▶ Play Now</div>
    <div class="ctx-item" data-action="next">Play Next</div>
    <div class="ctx-sep"></div>
    ${playlists.map(p => `<div class="ctx-item" data-action="addpl" data-plid="${p.id}">+ Add to "${escHtml(p.name)}"</div>`).join('')}
    ${playlists.length ? '<div class="ctx-sep"></div>' : ''}
    <div class="ctx-item" data-action="newpl">+ Add to New Playlist…</div>
  `;
  contextMenu.style.display = 'block';
  contextMenu.style.left = e.clientX + 'px';
  contextMenu.style.top = e.clientY + 'px';

  contextMenu.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'play') playTrack(track, sourceList);
      else if (action === 'next') insertNext(track);
      else if (action === 'addpl') addTrackToPlaylist(track, item.dataset.plid);
      else if (action === 'newpl') promptNewPlaylistWithTrack(track);
      hideContextMenu();
    });
  });

  // Reposition if offscreen
  const { right, bottom } = contextMenu.getBoundingClientRect();
  if (right > window.innerWidth) contextMenu.style.left = (e.clientX - contextMenu.offsetWidth) + 'px';
  if (bottom > window.innerHeight) contextMenu.style.top = (e.clientY - contextMenu.offsetHeight) + 'px';
}

function hideContextMenu() { contextMenu.style.display = 'none'; }

function insertNext(track) {
  if (!queue.length) { playTrack(track, allTracks); return; }
  queue.splice(queueIndex + 1, 0, track);
}

// ── Playlists ─────────────────────────────────────────────
function renderPlaylists() {
  const listEl = $('playlist-list');
  listEl.innerHTML = '';
  const emptyState = $('playlist-empty-state');

  if (!playlists.length) {
    emptyState.classList.remove('hidden');
    $('playlist-detail').classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  playlists.forEach(pl => {
    const item = document.createElement('div');
    item.className = 'playlist-item' + (pl.id === currentPlaylistId ? ' active' : '');
    item.innerHTML = `
      <div class="playlist-item-name">${escHtml(pl.name)}</div>
      <div class="playlist-item-count">${pl.tracks.length} track${pl.tracks.length !== 1 ? 's' : ''}</div>
    `;
    item.addEventListener('click', () => showPlaylistDetail(pl.id));
    listEl.appendChild(item);
  });

  if (currentPlaylistId) showPlaylistDetail(currentPlaylistId);
}

function showPlaylistDetail(plId) {
  currentPlaylistId = plId;
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;

  document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`.playlist-item`).forEach(el => {
    if (el.querySelector('.playlist-item-name')?.textContent === pl.name) el.classList.add('active');
  });

  const detail = $('playlist-detail');
  detail.classList.remove('hidden');
  $('playlist-empty-state').classList.add('hidden');
  $('playlist-detail-name').textContent = pl.name;
  $('playlist-detail-count').textContent = `${pl.tracks.length} track${pl.tracks.length !== 1 ? 's' : ''}`;

  const listEl = $('playlist-track-list');
  listEl.innerHTML = '';

  const tracks = pl.tracks.map(id => allTracks.find(t => t.id === id)).filter(Boolean);

  if (!tracks.length) {
    listEl.innerHTML = '<div class="empty-state" style="min-height:100px">No tracks yet.<br>Right-click a track to add.</div>';
    return;
  }

  tracks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'playlist-track-row';
    row.innerHTML = `
      <span class="pt-num">${i + 1}</span>
      <span class="pt-title">${escHtml(t.title)}</span>
      <button class="pt-remove" title="Remove" data-idx="${i}">✕</button>
    `;
    row.addEventListener('dblclick', () => { playClick(); playTrack(t, tracks); });
    row.querySelector('.pt-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      removeFromPlaylist(plId, i);
    });
    listEl.appendChild(row);
  });
}

function addTrackToPlaylist(track, plId) {
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  if (!pl.tracks.includes(track.id)) {
    pl.tracks.push(track.id);
    savePlaylists();
    if (currentPlaylistId === plId) showPlaylistDetail(plId);
    renderPlaylists();
  }
}

function removeFromPlaylist(plId, idx) {
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  pl.tracks.splice(idx, 1);
  savePlaylists();
  showPlaylistDetail(plId);
  renderPlaylists();
}

async function promptNewPlaylistWithTrack(track) {
  openModal((name) => {
    if (!name) return;
    const pl = { id: uid(), name, tracks: [track.id] };
    playlists.push(pl);
    savePlaylists();
    renderPlaylists();
  });
}

$('btn-new-playlist').addEventListener('click', () => {
  playClick();
  openModal((name) => {
    if (!name) return;
    const pl = { id: uid(), name, tracks: [] };
    playlists.push(pl);
    savePlaylists();
    currentPlaylistId = pl.id;
    renderPlaylists();
  });
});

$('btn-delete-playlist').addEventListener('click', () => {
  if (!currentPlaylistId) return;
  playClick();
  playlists = playlists.filter(p => p.id !== currentPlaylistId);
  currentPlaylistId = null;
  $('playlist-detail').classList.add('hidden');
  savePlaylists();
  renderPlaylists();
});

function savePlaylists() {
  window.takumi.savePlaylists(playlists);
}

// ── Modal ─────────────────────────────────────────────────
let _modalCb = null;
function openModal(cb) {
  _modalCb = cb;
  $('modal-playlist-name').value = '';
  $('modal-playlist').classList.remove('hidden');
  setTimeout(() => $('modal-playlist-name').focus(), 50);
}
function closeModal() { $('modal-playlist').classList.add('hidden'); _modalCb = null; }

$('btn-modal-cancel').addEventListener('click', closeModal);
$('btn-modal-create').addEventListener('click', () => {
  const name = $('modal-playlist-name').value.trim();
  if (name && _modalCb) _modalCb(name);
  closeModal();
});
$('modal-playlist-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('btn-modal-create').click();
  if (e.key === 'Escape') closeModal();
});

// ── Keyboard Shortcuts ────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') nextTrack();
  if (e.code === 'ArrowLeft') prevTrack();
});

// ── Helpers ───────────────────────────────────────────────
function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Start ─────────────────────────────────────────────────
init();