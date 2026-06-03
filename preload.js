const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('takumi', {
  // Folder
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  changeMusicFolder: () => ipcRenderer.invoke('change-music-folder'),
  rescanFolder: () => ipcRenderer.invoke('rescan-folder'),

  // Playlists
  getPlaylists: () => ipcRenderer.invoke('get-playlists'),
  savePlaylists: (playlists) => ipcRenderer.invoke('save-playlists', playlists),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Events from main
  onPromptFolderSelect: (cb) => ipcRenderer.on('prompt-folder-select', cb),
  onMusicFolderLoaded: (cb) => ipcRenderer.on('music-folder-loaded', (_, folder) => cb(folder)),
  onTracksLoaded: (cb) => ipcRenderer.on('tracks-loaded', (_, tracks) => cb(tracks)),
});