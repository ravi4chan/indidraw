# Final pre-hosting QA — 23 October 2026

Status: local release testing completed; no online deployment performed. This report records tested behavior and outstanding limits, not a guarantee that software is bug-free.

## Bugs found and fixed

1. **Conflicting tabs could overwrite saved work.** Timestamp ordering did not detect an older editor saving after another tab. Writes now compare the exact revision originally loaded in an atomic IndexedDB transaction. Opening an unchanged document no longer creates a spurious write. A conflicting tab displays “Not saved”, retains its scene, and can export a backup; the newer saved drawing survives reload.
2. **Personal library items vanished after reload.** The editor now uses the official library persistence adapter with a separate local IndexedDB database. Saved shapes survive reopening and are available across drawings. Existing drawing records do not require migration.
3. **Unnecessary external font fallback violated hosting CSP.** Excalidraw appended its CDN fallback even with a local asset path. A narrow, documented Vite transformation keeps that fallback on the same origin. Bundled local fonts and the strict CSP are retained. Review the adapter when upgrading Excalidraw.
4. **Web Embed was offered despite incompatible offline/native-import support.** The unavailable tool is hidden and embed validation disabled. Local Mermaid conversion remains available and produces editable shapes. No AI/backend feature is advertised or enabled.

## Validation

Final results: **32/32 Chromium/WebKit browser checks passed**, **17/17 unit tests passed**, strict TypeScript and ESLint passed, and the production build succeeded. The final full browser run completed in 24.3 seconds. A prior overlapping test invocation collided with Playwright trace-output cleanup; the final run was performed sequentially and passed without that artifact error.

The release suite runs against a local static server applying the actual `dist/_headers`, rather than relying solely on Vite preview. Repeat with:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
INDIDRAW_CSP_TEST=1 pnpm test:e2e --project=chromium --project=webkit
```

Coverage includes homepage/navigation, search and theme, all ten editable templates, title persistence, native import/export with images and Indic Unicode, PNG/SVG output, six language options and persistence, responsive layouts, offline refresh/edit/export, quota failure and backup recovery, concurrent-tab conflicts, corrupted-record preservation, personal-library persistence, Mermaid conversion, shapes/freehand/text, grouping/duplicate/delete and actual undo/redo state assertions. Geometry checks also exercise resizing, rotation, styling, panning and zoom.

Manual in-app browser testing used a separate drawing named “Final QA — Decision tree”. The original drawing was not edited. The saved-drawing chooser, theme, library and Mermaid dialogs were exercised visually.

## Remaining release limits

- Firefox's bundled test browser still cannot launch here: “Could not find profile folder”, before loading the site. This is unverified coverage. Test stable Firefox, Safari, Chrome and Edge and real touch/stylus devices before claiming complete compatibility.
- The dependency audit still reports one high advisory: `@excalidraw/excalidraw → sass → chokidar → braces` (GHSA-vfj7-8cjw-p6xm). The registry lists no published patched version. The affected Sass/watch tooling is outside the browser execution path; this is an exposure assessment, not removal of the advisory.
- Telugu native drawing-tool menus fall back to English. Other locale bundles have incomplete advanced strings. Native-speaker language/typography review remains pending.
- Automated accessibility scans cover informational pages; manual screen-reader/canvas accessibility is not certified.
- The real HTTPS host still needs a smoke test of response headers, direct route refresh, PWA/offline installation and downloaded exports. This cannot be completed before an actual deployment exists.
- Local storage is per browser and origin. Export native backups before moving from localhost to an online domain. Clearing browser data removes drawings and the personal library.
- This pass does not certify external public-library installation, every Mermaid diagram type, OS-native file picker behavior, service-worker rollback, device eviction or abrupt process termination. Do not label every optional upstream feature as verified.

Updated source and static ZIPs include the fixes. Repository privacy remains unchanged; no source was uploaded and no site was hosted by this QA pass.

## Font and terminology update

The subsequent five-font/glossary update passed all 36 Chromium/WebKit browser checks plus 17 unit tests. See `LOCALIZATION.md` and the dated update in `VERIFICATION.md`. Export is disabled until the canvas API is available. Previous launch limitations (Firefox environment, dependency advisory, final HTTPS smoke test and native-speaker review) remain applicable.
