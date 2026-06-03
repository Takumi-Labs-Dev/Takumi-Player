const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 820,
    minHeight: 560,
    frame: false,           // Custom titlebar
    transparent: false,
    backgroundColor: '#0a0a0c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: '匠 Takumi Player',
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // On first launch, prompt user to pick their music folder
  mainWindow.webContents.once('did-finish-load', () => {
    const savedFolder = getSavedMusicFolder();
    if (savedFolder) {
      mainWindow.webContents.send('music-folder-loaded', savedFolder);
      scanMusicFolder(savedFolder);
    } else {
      mainWindow.webContents.send('prompt-folder-select');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC Handlers ─────────────────────────────────────────────

// Open folder picker dialog
ipcMain.handle('select-music-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Your Music Folder — 匠 Takumi Player',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;

  const folderPath = result.filePaths[0];
  saveMusicFolder(folderPath);
  const tracks = scanMusicFolder(folderPath);
  return { folderPath, tracks };
});

// Change folder later
ipcMain.handle('change-music-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Change Music Folder — 匠 Takumi Player',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;

  const folderPath = result.filePaths[0];
  saveMusicFolder(folderPath);
  const tracks = scanMusicFolder(folderPath);
  return { folderPath, tracks };
});

// Rescan current folder
ipcMain.handle('rescan-folder', () => {
  const folder = getSavedMusicFolder();
  if (!folder) return null;
  const tracks = scanMusicFolder(folder);
  return { folderPath: folder, tracks };
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// Playlists — saved in userData
ipcMain.handle('get-playlists', () => loadPlaylists());
ipcMain.handle('save-playlists', (_, playlists) => {
  savePlaylists(playlists);
  return true;
});

// ── Helpers ──────────────────────────────────────────────────

const AUDIO_EXTS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.opus', '.wma'];
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const PLAYLISTS_PATH = path.join(app.getPath('userData'), 'playlists.json');

function scanMusicFolder(folderPath) {
  const tracks = [];
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (AUDIO_EXTS.includes(path.extname(entry.name).toLowerCase())) {
          const stat = fs.statSync(full);
          tracks.push({
            id: Buffer.from(full).toString('base64'),
            title: path.basename(entry.name, path.extname(entry.name)),
            filename: entry.name,
            path: full,
            ext: path.extname(entry.name).toLowerCase().replace('.', '').toUpperCase(),
            size: stat.size,
            folder: path.relative(folderPath, dir) || '/',
          });
        }
      }
    } catch (e) { /* skip inaccessible dirs */ }
  }
  walk(folderPath);
  mainWindow.webContents.send('tracks-loaded', tracks);
  return tracks;
}

function getSavedMusicFolder() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return cfg.musicFolder && fs.existsSync(cfg.musicFolder) ? cfg.musicFolder : null;
  } catch { return null; }
}

function saveMusicFolder(folderPath) {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  cfg.musicFolder = folderPath;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function loadPlaylists() {
  try { return JSON.parse(fs.readFileSync(PLAYLISTS_PATH, 'utf8')); }
  catch { return []; }
}

function savePlaylists(playlists) {
  fs.writeFileSync(PLAYLISTS_PATH, JSON.stringify(playlists, null, 2));
}