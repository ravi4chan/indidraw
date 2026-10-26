# Cloudflare static deployment

IndiDraw is a static site: no backend, database, secrets or paid plan are required.

## Cloudflare Pages

1. Fork or push this repository to your GitHub account.
2. Connect the repository to Cloudflare Pages. Select no framework preset.
3. Use a Node 22+ build environment with pnpm 11. Build command: `pnpm install --frozen-lockfile && pnpm build`. Build output directory: `dist`.
4. No environment variables are required. Optional build-time public setting: `VITE_REPOSITORY_URL`.
5. Preserve `_headers` for security and cache behavior. Pages supplies SPA fallback when no top-level `404.html` is present. Do not add a wildcard proxy to `index.html`: it can intercept physical JavaScript/font assets. Verify `/draw`, `/templates` and `/about` by direct navigation.
6. Deploy to HTTPS. Open `/draw`, wait for Offline ready, create a drawing, refresh, disconnect, refresh again and export the result. Confirm actual response headers on the hosted origin.

Cloudflare Workers static assets can also serve this build. In the dashboard upload flow use assets directory `/`, HTML handling `auto-trailing-slash`, and Not found handling `single-page-application`. Configure these after changing the uploaded files: the dashboard can reset the selections after file removal. Keep `_headers`; no `_redirects` file is needed for SPA fallback. Check physical JavaScript/font responses as well as HTML navigation after deployment.

## Cache and updates

Each production build hashes its contents and creates a new precache name. Install succeeds only if every asset caches successfully. New workers wait for old controlled tabs to close. Close all app tabs and reopen online to activate an update. No forced update interrupts active editing. Activation removes old app caches. IndexedDB is separate and is never cleared during cache updates.

Keep the database schema backwards-compatible. Changes to storage formats require explicit migrations and recovery tests. Do not change domains expecting local drawings to move: browser storage is origin-specific. A site at a new origin cannot read drawings from the old origin.

## Rollback

Use Cloudflare Pages' deployment rollback to select a known-good deployment. Close all app tabs and reopen online so the rolled-back service worker can install. Do not clear site data as a rollback step. Confirm local drawings still reopen and export. If the new code changed the database schema, a code rollback alone may be insufficient; plan migrations before releasing such changes.

## Environment notes

No server-side secret, API key, database, billing provider or AI provider is configured. `VITE_*` values are bundled into public JavaScript and must never contain secrets. Connect a custom domain only after HTTPS and origin-specific storage implications are understood.

## Local hosting-header rehearsal

After `pnpm build`, run `INDIDRAW_CSP_TEST=1 pnpm test:e2e --project=chromium --project=webkit`. The QA static server on port 4180 applies the built `_headers` configuration. This checks CSP and offline behavior before upload; it does not establish HTTPS or platform-specific deployment correctness. See `docs/FINAL-QA.md` for the current assessment.
