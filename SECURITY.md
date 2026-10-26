# Security policy

## Supported versions

| Version               | Supported |
| --------------------- | --------- |
| 0.2.x (latest `main`) | Yes       |
| Earlier               | No        |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Include what you found, how to reproduce it and the impact you expect. Do not include private drawings or personal data.

We aim to acknowledge reports within a week and will keep you updated while we investigate. Please give us reasonable time to release a fix before disclosing publicly. This is a volunteer project, so no response-time guarantee is offered.

## Security model

- **No backend.** IndiDraw has no server, accounts, API keys, analytics or uploads. Drawings stay in the browser's IndexedDB on the user's device.
- **No third-party requests.** Code, fonts and templates are served from the app's own origin.
- **Imports are validated** before Excalidraw restores them: file size and element limits, bounded geometry, allowed raster image types only, unsafe links removed, and SVG image payloads and external embeds rejected.
- **Hosting headers.** `public/_headers` applies a restrictive Content Security Policy, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, a referrer policy and a permissions policy that disables camera, microphone and location. The local Vite preview does not apply these headers; use `INDIDRAW_CSP_TEST=1 pnpm test:e2e` to rehearse them.
- **Exports can contain metadata.** PNG and SVG exports embed the editable scene; check files before sharing sensitive work.

## Dependencies

Run `pnpm audit` and review advisories against reachable behaviour before upgrading. When upgrading Excalidraw, review the version-pinned adapters in `vite.config.ts`.
