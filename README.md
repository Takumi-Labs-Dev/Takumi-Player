<div align="center">
<img src="renderer/assets/logo.png" width="220"/>

# 匠 ¦ Takumi Player
### A refined, minimalist music player — crafted with precision.
*An elegant desktop music experience inspired by Japanese editorial design — blending ink, stone, and gold into a seamless listening environment.*

---
</div>

---

## ✨ Overview

**匠 ¦ Takumi Player** is a beautifully crafted desktop music player built with **Electron**, focused on **aesthetic clarity, smooth interaction, and immersive minimalism**.

Designed with a **dark, refined UI** inspired by Japanese editorial design, Takumi Player delivers a distraction-free listening experience while maintaining powerful functionality under the hood.

---

## 🎨 Design Philosophy

> *"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."*

- 🖤 **Near-black foundation** — calm and focused
- 🪶 **Soft typography hierarchy** — Cormorant Garamond, Noto Serif JP, DM Mono
- 🥇 **Gold accent system** — subtle but expressive
- 🎧 **Fluid motion** — smooth, intentional animations

---

## 🚀 Features

### 🎵 Core Playback
- High-quality audio playback (MP3, FLAC, WAV, OGG, M4A, AAC, OPUS, WMA)
- Smooth track switching with prev / next controls
- Shuffle queue and three repeat modes (Off → All → One)
- Seekable progress bar with live time display
- Draggable volume bar with scroll wheel support
- Keyboard shortcuts — `Space` play/pause, `←` `→` prev/next, `Ctrl+A` select all, `Esc` clear selection

### 🎛️ Visual Experience
- Spinning disc animation while playing
- Animated gold equalizer bars replacing track numbers during playback
- Hover-responsive progress bar (3px → 5px with gold thumb)
- Custom frameless window with draggable titlebar
- Subtle UI click sounds on interactions

### 📂 Music Library
- Folder picker on first launch — remembers your folder across sessions
- Recursive folder scan — finds all supported audio files including subfolders
- Live search — filter by title or folder name
- **Drag to reorder** tracks — rearrange your library lineup freely
- **Multi-select** — click checkboxes or use `Ctrl+A` to select multiple tracks
- Selection action bar — Play, Add to Playlist, Remove, or Clear selection
- Right-click context menu — Play Now, Play Next, Add to Playlist, Remove from Library
- ⟳ Change folder and ↺ Refresh buttons in the sidebar

### 🎶 Playlist System
- Create, rename, and delete playlists
- Add single or multiple tracks to playlists via right-click or selection bar
- **Drag to reorder** tracks within any playlist
- Remove individual tracks from playlists
- Active playlist highlighted with gold left border
- Track count displayed per playlist

### 🎯 UI/UX Details
- Frameless window with custom minimize / maximize / close controls
- Custom draggable titlebar with app logo
- Welcome overlay on first launch with folder selection prompt
- Persistent playlists and folder path saved between sessions
- Right-click menus intelligently operate on multi-selection when tracks are selected

---

## 🧱 Tech Stack

- ⚡ **Electron** — desktop runtime
- 🟨 **Vanilla JavaScript** — no frontend frameworks
- 🎨 **Custom CSS** — design-system driven, CSS variables throughout
- 🔤 **Cormorant Garamond / Noto Serif JP / DM Mono** — typography stack

---

## 🧩 Theme System

Takumi Player uses a carefully designed color system:

| Role       | Value              | Description              |
|------------|--------------------|--------------------------|
| Background | `#0a0a0c`          | Deep near-black          |
| Surface     | `#111116`          | Sidebar & player bar     |
| Surface 2  | `#18181f`          | Inputs, hover, badges    |
| Accent     | `#c8a96e`          | Primary gold — ink       |
| Accent 2   | `#e8c98e`          | Hover gold               |
| Text       | `#e2ddd6`          | Warm off-white           |
| Text 2     | `#8a8580`          | Muted labels             |
| Text 3     | `#5a5550`          | Dim — timestamps, nums   |
| Danger     | `#c25a5a`          | Delete / destructive     |
| Border     | `rgba(255,255,255,0.07)` | Subtle dividers    |

---

## 📁 Project Structure

```
takumi-player/
│
├── main.js              # Electron main process — window, IPC, file scanning
├── preload.js           # Secure bridge between Node and renderer
├── package.json
├── README.md
│
└── renderer/            # UI & frontend
    ├── index.html       # App shell & layout
    ├── style.css        # Full design system
    ├── app.js           # All player logic
    │
    └── assets/
        ├── logo.png          # App logo
        ├── icon.ico          # Windows taskbar / installer icon
        └── sounds/
            └── click.wav     # UI interaction sound
```

---

## 📦 Installation

### ⬇️ Download

Get the latest installer from:

👉 [https://github.com/Takumi-Labs-Dev/Takumi-Player/releases](https://github.com/Takumi-Labs-Dev/Takumi-Player/releases)

---

### 🛠️ Run from Source

```bash
git clone https://github.com/Takumi-Labs-Dev/Takumi-Player.git
cd takumi-player
npm install
npm start
```

> **Windows note:** If Electron fails to install, run:
> ```powershell
> Invoke-WebRequest -Uri "https://github.com/electron/electron/releases/download/v42.3.2/electron-v42.3.2-win32-x64.zip" -OutFile "electron.zip"
> Expand-Archive -Path "electron.zip" -DestinationPath "node_modules/electron/dist" -Force
> [System.IO.File]::WriteAllText("node_modules\electron\path.txt", "electron.exe")
> npm start
> ```

---

### 📦 Build `.exe` Installer

```bash
npm run build
```

Output is placed in `dist/`. The installer is a standard Windows NSIS setup — users can choose their install directory.

---

## 🛣️ Roadmap

- [ ] Audio visualizer modes
- [ ] Theme customization panel
- [ ] Album art / metadata display
- [ ] Import / export playlists
- [ ] Mini player mode
- [x] Multi-select tracks
- [x] Drag to reorder library and playlists
- [x] Shuffle & repeat modes
- [x] Keyboard shortcuts
- [x] Click sound feedback
- [x] Persistent playlists & folder memory

---

## 👤 Author

**匠 ¦ Takumi Hub**

---

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">

### 🎧 Crafted with precision — not excess.

*Developed by Takumi Hub*

</div>