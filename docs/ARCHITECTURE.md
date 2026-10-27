# Architecture

IndiDraw is a static, client-only single-page application. Everything — drawing, saving, transliteration and the diagram assistant — runs in the browser. There is no backend.

```text
                         ┌──────────────────────────── Browser ────────────────────────────┐
                         │                                                                  │
  /, /templates, /about  │  App.tsx (website)  ──┐                                          │
                         │                       ├─ i18n (languages.tsx, siteStrings.ts)    │
  /draw                  │  Editor.tsx ──────────┘                                          │
                         │    ├─ <Excalidraw>  (upstream editor, unmodified)               │
                         │    ├─ FileMenu, save badge, toasts                              │
                         │    ├─ PhoneticTyping ──► transliteration/input.ts ► indic.ts    │
                         │    ├─ DiagramAssistant ──► assistant/commands.ts ► scene.ts     │
                         │    └─ storage/documents.ts ──► IndexedDB "indidraw"             │
                         │                                                                  │
                         │  sw.js (generated) ──► Cache Storage "indidraw-<hash>"           │
                         └──────────────────────────────────────────────────────────────────┘
                                         ▲
                                         │ static files only (HTML, JS, CSS, fonts)
                                  Cloudflare Pages / any static host
```

## Entry points

- `src/main.tsx` renders `Editor` (lazy-loaded) for `/draw` and `App` for every other path, inside an error boundary. In production it registers `/sw.js`.
- `public/asset-path.js` runs before the app: it points Excalidraw at locally hosted fonts and applies the saved dark theme before first paint.

## Website (`src/App.tsx`)

The home page, template gallery, About and policy pages. The header language menu uses the same `useLanguage` hook and `localStorage` key as the editor, so a language chosen on the site carries into `/draw`. Home and gallery text is translated through `ui()`; About and policy pages are English.

## Editor (`src/editor/Editor.tsx`)

A thin wrapper around the official `@excalidraw/excalidraw` React component. It owns everything around the canvas:

- **Header:** drawing title, save badge, diagram assistant toggle, language and keyboard controls, the File menu (`FileMenu.tsx`) and theme toggle.
- **Saving:** `onChange` serialises the scene, debounces for 650 ms and writes to IndexedDB. The badge shows _saved_ only after the transaction completes.
- **Notices:** short notices float above the canvas and fade; errors stay until dismissed and offer **Retry** and **Download backup**.
- **Import and export:** native `.excalidraw` files are validated by `validation.ts` (size, element count, geometry bounds, allowed image types, safe links) before restoring. Exports use Excalidraw's `exportToBlob` / `exportToSvg`; SVGs with Indian scripts embed their fonts (`indicFonts.ts`).
- **Language changes** save the drawing, store the preference and reload, which avoids racing Excalidraw's asynchronous locale loading.

## Storage (`src/storage`)

| Database           | Store      | Contents                                                                    |
| ------------------ | ---------- | --------------------------------------------------------------------------- |
| `indidraw`         | `drawings` | One record per drawing: id, title, serialised scene, revision, updated time |
| `indidraw-library` | `library`  | The personal Excalidraw shape library                                       |

Each save carries the revision the editor originally loaded and is applied in a single transaction. If another tab saved a newer revision first, the write is rejected and the editor shows _Not saved_ with a backup option rather than overwriting work. Restoring a damaged record never overwrites it.

## Offline (`scripts/service-worker.mjs`)

After `vite build`, the script hashes every file in `dist/` and writes `dist/sw.js` with:

- a cache name derived from the content hash, so each release gets a fresh cache;
- an install step that caches every asset atomically (a partial install is discarded);
- cache-first responses for same-origin GET requests, and the cached app shell for navigations.

New versions wait until old tabs close, so an update never interrupts an editing session. IndexedDB is separate from the cache and is never cleared by updates.

## Indian-language support

| Concern                                 | Where                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| UI language list and `ui()` lookup      | `src/i18n/languages.tsx`                                                       |
| Editor and site translations            | `src/i18n/languages.tsx`, `src/i18n/siteStrings.ts`, `src/i18n/editorTerms.ts` |
| Excalidraw terminology overrides        | `vite.config.ts` (version-pinned adapter) and `editorTerms.ts`                 |
| Selectable canvas fonts (IDs 201–205)   | `src/editor/languageFonts.ts`                                                  |
| Fallback shaping and SVG font embedding | `src/editor/indicFonts.ts`                                                     |
| Fonts for generated labels              | `src/editor/labelFont.ts`                                                      |
| Website typography for Indian scripts   | `src/styles.css` (`IndiDraw Site` font faces)                                  |
| Font files and licences                 | copied from `@fontsource/*` by `scripts/assets.mjs`                            |

`vite.config.ts` contains two small, version-pinned transforms of the Excalidraw bundle: one keeps Excalidraw's font fallback on the same origin (required by the Content Security Policy), the other exposes the font registry and terminology function. Both fail the build loudly if the upstream code changes, so they must be reviewed when upgrading Excalidraw.

## Phonetic typing (`src/editor/transliteration`)

`PhoneticTyping.tsx` watches the drawing surface for Excalidraw's text editor (`textarea[data-type="wysiwyg"]`) and attaches `input.ts` to it. The adapter intercepts newly typed English letters, replaces the current word with the first suggestion from the active engine — `hindi.ts` for Hindi, `indic.ts` (rules for conjuncts, vowel signs, virama and chillu/anusvara endings plus `dictionaries.ts`) for Telugu, Bengali, Tamil, Marathi and Malayalam. `typingMode.ts` ties the default keyboard to the app language and remembers overrides per language, and keeps its own undo history for those edits. Pasted, composed (IME) and native-keyboard input pass through untouched. Details: [HINDI-TYPING.md](HINDI-TYPING.md).

## Diagram assistant (`src/editor/assistant`)

- `commands.ts` defines a small, allowlisted operation protocol (`add_node`, `connect_nodes`, `rename_node`), validates any payload and plans operations from the text grammar.
- `scene.ts` applies a batch to the Excalidraw scene atomically: it places shapes, binds arrows on both ends, records batch receipts in `customData`, and can revert a batch.
- `DiagramAssistant.tsx` previews a batch as a dry run, draws it with `AssistantGhost.tsx` over the canvas, applies it as one undoable update, and refuses to apply if the canvas changed after the preview.

Providers can only ever emit data, never code. Design notes and the voice roadmap: [VOICE-CANVAS.md](VOICE-CANVAS.md).

## Security boundaries

- The app makes no third-party network requests; fonts, code and templates are served from the same origin.
- `public/_headers` sets a restrictive Content Security Policy, frame denial, MIME-sniffing protection and a permissions policy on Cloudflare.
- Imported files are validated before Excalidraw restores them; SVG image payloads and external embeds are rejected.

## Testing

- `tests/*.test.ts` (Vitest, Node): validation, storage, templates, transliteration, assistant protocol, label fonts and translations.
- `tests/e2e/*.spec.ts` (Playwright): the production build in Chromium and WebKit — saving, offline, import/export, templates, languages and fonts, Hindi typing, the assistant, usability flows, responsive layout and axe accessibility scans. `tests/serve-production.mjs` serves the build with the real `_headers` for a hosting rehearsal.
