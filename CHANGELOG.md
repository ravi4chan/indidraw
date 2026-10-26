# Changelog

All notable changes to IndiDraw are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-10-26

### Added

- **Hindi phonetic typing** on the canvas: type with English letters (`namaste` → `नमस्ते`), with spelling choices shown under the word; <kbd>Space</kbd> keeps the first, <kbd>1</kbd>–<kbd>9</kbd> pick another. Pasted, IME and native-keyboard input are never changed.
- **Diagram assistant** (offline, no AI): build connected diagrams from commands such as `Roof → Filter → Tank`, preview them as a dashed outline on the canvas, apply as one undoable step, and undo from the panel.
- **File menu** with new, open, templates, import and export actions, usable from the keyboard.
- **Language menu on the website**, shared with the editor. The home page and template gallery are translated into Hindi, Telugu, Bengali, Tamil and Marathi.
- A **languages section** on the home page with a phonetic typing demo.
- **Three Hindi templates** (rainwater harvesting, lesson plan, project plan), an "In Hindi" filter, and search and filters in the editor's template picker.
- A prompt to **name untitled drawings** on first export, a naming reminder, and a **backup reminder** after 30 minutes of drawing.
- Bundled **Noto Sans** faces for the website in Devanagari, Telugu, Bengali and Tamil (regular and semibold), loaded only when a page shows that script.
- Architecture guide, pull request template, issue forms and continuous integration.

### Changed

- The editor header fits on one row: title and save badge, assistant, language with keyboard, File menu and theme. On phones it becomes two compact rows.
- Notices float over the canvas and fade instead of pushing the drawing down; errors stay until dismissed and offer **Retry** and **Download backup**.
- The save state is a clear badge: a green check when saved, a spinner while saving, and a red warning when a save fails.
- Assistant and template labels use the hand-drawn Excalifont, or the matching Indian-script font for labels in those scripts.
- Website text is larger and higher contrast; the home page has fewer, more focused sections; the hero preview opens the flowchart for editing.
- Indian-script text on the website uses natural letter and word spacing and taller lines.

### Fixed

- Capitalised words were transliterated as different letters (`Ganga` became `ग़न्ग`); phonetic input is now case-insensitive.
- Dark mode briefly flashed white on every page load.
- Long drawing titles were cut off in some languages and screen widths.
- Letter spacing split Indian-script letters apart in small labels.
- Safari rejected the cached app shell for offline navigation when the host redirected `/index.html`.

## 0.1.1 — 2026-10-23

### Added

- Editor language selector for English, Hindi, Telugu, Bengali, Tamil and Marathi, remembered on the device.
- Five selectable canvas fonts for Indian languages and reviewed editor terminology.
- Language, offline, responsive-title and script-export tests.

### Fixed

- Conflicting tabs could overwrite saved work; saves now compare revisions atomically.
- The personal shape library now persists across reloads.
- Excalidraw's CDN font fallback is kept on the same origin to satisfy the Content Security Policy.
- Web Embed, which cannot round-trip through native import, is hidden.

## 0.1.0 — 2026-10-22

### Added

- Initial release: branded website and policy pages, the Excalidraw editor, IndexedDB autosave, native import and export, PNG and SVG export, ten editable templates, light and dark themes, and a versioned offline cache.
