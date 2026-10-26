# Verification and release status

> Historical QA record from the 0.1.x releases, kept for traceability. Later results are summarised in [FINAL-QA.md](FINAL-QA.md), [HINDI-TYPING.md](HINDI-TYPING.md), [VOICE-CANVAS.md](VOICE-CANVAS.md) and the [changelog](../CHANGELOG.md).

Verified locally on 22 October 2026. This is a working Phase 1 implementation, **not a claim that every production acceptance gate is complete**. No remote deployment, public repository, paid cloud service or third-party account was created.

## Completed checks

- TypeScript strict type check: passed.
- ESLint: passed.
- Vitest: 13 tests passed. Native input validation, malformed/oversized inputs, Unicode text preservation, embedded images, unsafe links, IndexedDB save/reload, missing documents, stale-write rejection, and template graph validity.
- Vite production build: passed. Excalidraw font assets are copied locally and a content-versioned service worker is generated.
- Playwright in Chromium and WebKit: 14 main checks passed, covering online editor startup, title persistence after refresh, native downloads, offline reload, offline edits and recovery, offline PNG/SVG exports, gallery filtering, themes, drawing shapes/freehand/text, undo/redo actions, image insertion, Devanagari text, native import/export round trip, PNG/SVG output, and all ten templates opened/exported as actual drawings.
- Axe automated WCAG A/AA scans: no reported violations on homepage, templates, About and Privacy pages in light and dark mode, in both tested engines. This is not an accessibility certification or a full manual screen-reader assessment.
- Responsive overflow checks: passed at 1440, 768 and 390 CSS pixels in both engines. Desktop and phone-scale visuals were inspected.
- Two additional Playwright checks passed (Chromium and WebKit) for simulated storage-quota failure. “Not saved” and the quota error stay visible, New retains the current board, and native backup export still succeeds. Total: 16 passed browser checks across the main and failure suites.
- Manual in-app browser: confirmed branding, genuine editable flowchart, title persistence, and completed local-save status.

The suite uses Playwright's browser builds rather than claiming coverage of every shipping consumer browser. Image insertion tests exercise the ordinary HTML file-input fallback; the operating-system File System Access picker still needs manual verification where supported.

## Dependency review

The final npm audit reports **one high advisory and zero critical, moderate or low advisories**. Remaining path: `@excalidraw/excalidraw → sass → chokidar → braces`. Advisory GHSA-vfj7-8cjw-p6xm concerns deeply nested patterns; the audit lists no published patched version. Sass/file watching is not imported by this browser SPA. Do not describe the dependency tree as vulnerability-free. Recheck the saved `dependency-audit.json` and upstream patches before public release.

Patched overrides for nanoid, lodash-es and KaTeX are recorded in `pnpm-workspace.yaml`. Excalidraw was updated to 0.18.1. The build/test tooling was updated to Vite 8.3.5 and Vitest 5.0.5. Overrides are covered by the app checks, but optional upstream features such as Mermaid conversion are outside this release's advertised and verified scope. ESLint 9 prints a support/deprecation notice; migration to ESLint 10 can be reviewed separately.

## Measured build characteristics

The static distribution is approximately **22 MiB uncompressed** including the complete Excalidraw font distribution and code-split optional upstream assets. The first successful offline installation caches the generated static asset list atomically. This is a meaningful initial download; future optimization should selectively trim unused upstream assets while preserving offline drawing and export. No Lighthouse score, frame-rate benchmark, latency promise or mid-range-device performance result is invented.

## Remaining release gates and limitations

1. Firefox automation was attempted twice and could not launch: the browser reported “Could not find profile folder” before loading IndiDraw, including a retry with `/private/tmp`. This is an environment limitation, not a passing test. Real stable Chrome, Edge, Firefox and Safari still need the complete manual release matrix. Playwright WebKit does not establish Safari certification, nor Chromium establish Edge certification.
2. No Cloudflare deployment was performed. Validate `_headers` CSP, HTTPS, SPA routing, installability, offline refresh and saved drawings on the real target origin before launch. Vite preview does not apply Cloudflare's security headers. Storage belongs to its original browser origin; it cannot migrate automatically to a new domain.
3. Devanagari text creation, native preservation, and image export code paths are tested. A local Noto Sans Devanagari font supplies glyphs, and SVG export embeds that font for Devanagari text. Fluent-reader typographic review of conjuncts, combining marks and complex-script shaping across target browsers is still required. The 23 October update adds a six-option editor language selector and bundled Telugu, Bengali and Tamil fonts. The selection persists locally; custom controls are translated. Available upstream Hindi, Bengali, Tamil and Marathi locale bundles supply native tool translations, with English fallback for incomplete strings. Telugu native tool menus remain English, clearly noted in the interface. These initial translations have not received native-speaker review.
4. Native imports intentionally reject SVG image payloads and external embeds. Locally inserted SVG images are retained for local recovery; native backup export rasterizes them to PNG, capped at 4096 pixels on the long side. That loses vector-image fidelity. PNG and SVG diagram export remain available. Native imports are capped at 20 MiB and 10,000 elements; a larger exported board may need splitting before reimport.
5. Local autosave cannot guarantee data survival after site-data deletion, browser eviction, private browsing, device loss or an immediate forced process termination. Export backups. Persistent browser storage is optional and browser-controlled. Interrupted transactions are atomic, but termination timing and denied storage need real-device stress testing.
6. Revisions reject stale writes but do not merge simultaneous tabs. There is no collaboration, version history, cloud backup or account system.
7. A verified public repository, private security reporting channel, and community moderation contact are not configured. Public GitHub/contact links are omitted instead of invented. Confirm owner-supplied logo redistribution rights before public source publication. Original code is delivered under MIT; third-party and font notices are retained.
8. Keyboard operation and automated scans do not make a visual canvas fully usable by screen-reader users. Conduct manual assistive-technology and touch/stylus checks before claiming WCAG 2.2 AA conformance.
9. The logo is cropped raster artwork with a white background, not an invented SVG. Dark mode retains a light backing to preserve the approved artwork.

## Recommended next phase

Finish Phase 1 release validation on real browsers/devices and the chosen HTTPS host. Resolve or explicitly assess the remaining dependency advisory; complete manual accessibility and complex-script review; confirm branding rights and repository/reporting destinations. Only then start optional cloud synchronization/authentication work. Keep the free offline editor independent of those services.

## Manual release checklist

- Draw/resize/rotate/group/duplicate/delete; add and edit text; pan/zoom; align and style; image insertion; keyboard undo/redo.
- Export/import a native board containing images and multilingual text; inspect PNG/SVG fidelity in other viewers.
- Complete caching online, close/reopen offline, edit/save, refresh, reopen the saved drawing and export offline.
- Denied storage, full quota, corrupted stored records, forced shutdown, multiple tabs and app update/rollback.
- Stable Chrome, Edge, Firefox, Safari; desktop/tablet/touch/stylus; screen reader and keyboard-only operation.

## 23 October 2026 — language selector and title field update

- English is the default; the editor header offers Hindi, Telugu, Bengali, Tamil and Marathi. The preference persists locally. Custom editor controls have initial translations; available upstream native locales are enabled. Telugu native tool menus and untranslated advanced strings fall back to English. Native-speaker review remains pending.
- Language changes flush the current document before saving the preference and reopening the same board. This avoids an upstream asynchronous locale-loading race. Undo/redo history is session-only and restarts after reopening. A failed local save blocks the language change.
- The title field grows with its content and uses responsive header space; the complete “My first IndiDraw book” title fits at desktop, tablet and phone widths. Very long titles have a full-value tooltip and normal editable input scrolling. Title editing is disabled while restoration is pending to prevent a startup overwrite.
- Noto Devanagari, Telugu, Bengali and Tamil fonts are locally bundled and precached. Native exports retain all tested Unicode strings; SVG exports embed the corresponding script fonts. Hindi and Marathi share the Devanagari font.
- TypeScript, ESLint, production build and 17 unit tests passed. All 20 Chromium/WebKit browser checks passed in the final suite, including actual native locale labels, language persistence, unchanged element identifiers, offline language switching, responsive title width, script exports and the existing drawing regression suite.
- To activate a cached local-preview update, wait for local saving to finish, close every IndiDraw tab, then reopen the same editor URL. This changes app assets without clearing IndexedDB drawings.

## 23 October 2026 — final pre-hosting review

See [FINAL-QA.md](FINAL-QA.md) for the current release assessment. This pass adds transactional expected-revision conflict detection, persistent personal libraries, a local-only font fallback, and disables the unsupported Web Embed tool. The expanded suite applies actual hosting CSP headers and checks corrupted-record preservation, true undo/redo, transformations, local Mermaid conversion and cross-tab backup recovery. Historical counts above describe earlier runs.

## 23 October 2026 — selectable Indian fonts and reviewed core labels

- Added five native-picker choices: Hindi Noto Sans Devanagari (201), Telugu Noto Sans Telugu (202), Bengali Noto Sans Bengali (203), Tamil Noto Sans Tamil (204), Marathi Noto Serif Devanagari (205).
- Custom IDs survive IndiDraw native save/reload/import; offline SVG embeds complete local font files, retaining shaping tables without optional font-subsetting workers. Other whiteboard applications may substitute fonts for these IDs.
- Core header/settings labels now follow the source-informed glossary in `LOCALIZATION.md`. The Hindi Rectangle typo is corrected to “आयत”. Advanced untranslated strings remain English; this is not a native-speaker certification.
- Export waits until the canvas API is ready, avoiding ignored export selections immediately after restoration.
- Strict TypeScript, ESLint, production build, 17 unit tests, and all 36 Chromium/WebKit browser checks passed. The browser suite includes all five font selections, saved IDs, native import, offline PNG/SVG export and settings labels for all five languages. The existing Firefox environment limitation remains.

## Cloudflare dashboard upload correction

The Workers upload form was inspected directly. Not found handling was `none`; it was changed to `single-page-application`. Removed the universal `/* /index.html 200` proxy from the upload draft and source: SPA fallback belongs to the host's not-found handling, while real JavaScript/font files must remain physical assets. The dashboard reset its routing field after removing a file, so SPA handling was selected again after the upload change. Production build passed. No deployment-error message was visible before retry; a failed deployment cause is not claimed without that retry's result.

## Safari production navigation correction — 2026-10-23

Reproduced Safari WebKitInternal:0: “Response served by service worker has redirections” after Start Drawing. Cloudflare redirects index.html to /; navigation now reconstructs the cached response without redirect metadata. Production build and a redirected-cache regression check passed. Deployed version 5780f1fa; verified Start Drawing and editor reload in the affected Safari session, with Offline ready. Closed and reopened the affected site tab to release the old worker; no browser storage was cleared.

## Hindi phonetic typing — 2026-10-23

Added an offline Hindi-only phonetic adapter to the Excalidraw textarea and a separate three-mode selector. Default Hindi phonetic mode is initialized by the existing UI language; stored English/Hindi text is never converted by switching language or mode. The MIT-licensed Sanscript 1.3.3 engine is supplemented with everyday Hindi spelling preferences; the engine alone was not treated as a natural Hindi input method.

Validation: 50 unit tests passed; the full Chromium/WebKit regression suite passed 44 checks, including eight Hindi checks. The final Hindi suite, including an additional negative test for existing English text, passed all 10 Chromium/WebKit checks under the production CSP headers. Covered keyboard cursor movement, selection replacement, phonetic Backspace, text and canvas undo/redo, real Unicode copy/paste, simulated native composition, literal English/native modes, mode/language preservation, saving/reloading/importing, offline new typing, PNG signatures and SVG Unicode/embedded fonts. Typecheck, ESLint and production build passed. Firefox was not run for this feature. Actual OS-native Hindi IME behavior remains a manual cross-device check; tests cover the browser composition event path.

Manual browser verification: selected Hindi in the existing dropdown, confirmed automatic Hindi Phonetic mode, and typed ordinary English keys `namaste bharat` to get `नमस्ते भारत`. Screenshot: ../indidraw-hindi-phonetic.png. Details, full modified-file list, spelling limitations and repeatable manual checks: HINDI-TYPING.md. This feature is packaged locally and has not been deployed online.
