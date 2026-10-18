# Volume Master Max 🔊

> A powerful, privacy-first browser extension for granular audio control, per-tab volume adjustment, and audio boosting up to 600%. Built with a sleek Soft Pastel Neo-Brutalist design system.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Author](https://img.shields.io/badge/author-Pratham%20Jain-purple.svg)

---


## Tech stack — languages, frameworks, and key dependencies from the manifest and source files.

- **Language:** JavaScript (ES6)
- **Platform:** Chrome Extension (Manifest V3)
- **Core components:**
  - `offscreen.js` – helper for creating a custom require function and exposing extension constants.
  - `popup.js` – UI logic for the extension popup, handling shortcuts and audio gain.
  - `service-worker.js` – background service worker managing notifications and storage.
- **APIs used:** Chrome extension APIs (`chrome.runtime`, `chrome.storage`, `chrome.action`, etc.)
- **No external dependencies** – the code is self‑contained.


## Motivation — why this project exists, derived from what the code actually does.

Volume Master Max is a privacy‑first Chrome extension that gives users granular, per‑tab audio control and the ability to boost volume up to 600 %. It was created to let users hear quiet media without relying on external services or analytics.

## ✨ Features

- **🔊 Up to 600% Volume Boost**: Amp up quiet videos, audio streams, and web pages beyond standard system limits.
- **🎛️ Per-Tab Volume Control**: Control the volume of each tab playing audio independently right from the extension popup.
- **🎚️ Audio Equalizer & Presets**: Instant audio tuning with built-in presets:
  - **Default**: Balanced audio response
  - **Voice Boost**: Enhanced vocal frequency clarity for lectures & podcasts
  - **Bass Boost**: Deep bass enhancement for music
- **🎨 Soft Pastel Neo-Brutalist UI**: High-contrast, tactile interface with smooth dark mode support.
- **🛡️ 100% Offline & Private**: Zero external analytics, zero tracking, no third-party network connections.

---

## 🛠️ Installation Guide

### Manual Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/prathamjain2011/volume-master-max.git
   ```
2. Open Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked**.
5. Select the `volume-master-max` project directory.
6. Pin **Volume Master Max** to your extension toolbar and enjoy!

---

## ⌨️ Keyboard Shortcuts

- **`0` – `6`**: Jump directly to volume levels (`0%` to `600%`).
- **`D`**: Switch to Default Equalizer Preset.
- **`V`**: Switch to Voice Boost.
- **`B`**: Switch to Bass Boost.
- **`R`**: Reload Popup.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

Developed with ♥ by **Pratham Jain** (`prathamjain2011@gmail.com`).


## Tests — how to run them, from manifest scripts or test files; if the repo has no tests, say so in one line.

No test suite is included in this repository.


## API reference — the public surface from the existing README, file names, and source files.

- **`offscreen.js` exports**
  - Constants such as `TARGET_SERVICE_WORKER`, `TARGET_OFFSCREEN_DOCUMENT`.
  - Action identifiers like `ACTION_POPUP_AUDIO_DATA_GET`, `ACTION_POPUP_GAIN_CHANGE`, etc.
  - Helper functions: `getAppVersion()`, `getUrl(urlStr, utmContent)`, `updateUrl(urlStr)`.
- **`service-worker.js` exports**
  - `notifications` array containing predefined tip notifications.
  - Storage helper (`get`, `set`) that wraps `chrome.storage.local`.
- **`popup.js`** (module exports not shown fully) interacts with UI elements and uses the configuration from `./config` and audio utilities from `./audio-gain.js`.
- **Manifest (manifest.json)** defines the extension as a Manifest V3 Chrome extension, specifying the service worker, offscreen document target, permissions, and UI assets.


## Code example — a short usage snippet from the existing README or the source files.

```javascript
// Example: Getting a stored setting using the storage helper (service‑worker.js)
const storage = require('./modules/storage');
storage.get('volumeLevel', 100).then(level => {
  console.log('Current volume level:', level);
});
```


## Screenshots — show the user-uploaded images using the relative paths given in the context.

*(No local screenshot images are provided in the repository.)*


## Code style — lint/format tools only if configured; otherwise the style observed in the source files.

The project does not include a linting or formatting configuration. The source follows a conventional JavaScript style:
- Uses `const` and `let` with arrow functions where appropriate.
- Modules are exported via `module.exports`.
- Semi‑colons are present at the end of statements.
- Indentation is two spaces.
- Inline comments are minimal.


## Build status — the real CI badge or workflow when one exists (never invent a badge); otherwise how to build and verify from the repo files.

No continuous‑integration workflow is configured for this repository. To verify the extension:
1. Follow the **Usage** steps to load the unpacked extension in Chrome.
2. Open the popup and test the keyboard shortcuts (0‑6, D, V, B, R) to ensure volume control works as expected.
3. Check the background service worker (chrome://extensions → Details → Service worker) for any errors.


## Usage — copy-pasteable usage from the code or existing README. Never invent commands.

```bash
# 1. Clone the repository
git clone https://github.com/prathamjain2011/volume-master-max.git

# 2. Open Chrome and go to the extensions page
#    (you can type this in the address bar)
chrome://extensions

# 3. Enable **Developer mode** (toggle in the top‑right).
# 4. Click **Load unpacked** and select the cloned `volume-master-max` folder.
# 5. Pin the extension toolbar icon to start using Volume Master Max.
```

---

*Created with [repo-doctor](https://prathamjain.com/projects/repo-doctor)*
