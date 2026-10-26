# Contributing to IndiDraw

Thank you for helping make visual thinking easier for everyone. Contributions of all sizes are welcome — bug reports, translations, accessibility fixes, tests, documentation and code.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Translations.** Native-speaker review of Hindi, Telugu, Bengali, Tamil and Marathi text is the most valuable contribution right now. See [docs/LOCALIZATION.md](docs/LOCALIZATION.md).
- **Accessibility.** Screen-reader, keyboard and contrast testing on real devices.
- **Bugs.** Open an issue with steps to reproduce (see below).
- **Features.** Open a feature request first so we can agree on the approach before you write code.

## Development setup

You need Node.js 22.12+ and pnpm 11.

```sh
git clone https://github.com/ravi4chan/indidraw.git
cd indidraw
pnpm install --frozen-lockfile
pnpm dev
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a tour of the code.

## Before you open a pull request

Run the same checks as CI:

```sh
pnpm typecheck
pnpm lint
pnpm exec prettier --check src tests scripts
pnpm test
pnpm build
```

For changes to the editor, saving, offline behaviour, languages or layout, also run the browser tests:

```sh
pnpm exec playwright install chromium webkit
pnpm test:e2e --project=chromium --project=webkit
```

## Guidelines

- **Keep Excalidraw upstream.** Wrap and configure the official package; do not fork or patch its behaviour. The two version-pinned adapters in `vite.config.ts` are the only exceptions and must keep failing loudly when upstream changes.
- **Stay local-first.** Do not add analytics, tracking, paid gates, diagram uploads or third-party network requests to the free editor.
- **Never lose work.** Changes to saving or storage need recovery tests, and storage format changes need a migration.
- **Accessible by default.** Interactive elements need accessible names, keyboard support and AA contrast in both themes. The axe browser tests must stay green.
- **Translations.** Add new interface text to `src/i18n/siteStrings.ts` with all six languages, keep English keys stable, and avoid letter spacing on Indian scripts.
- **Tests.** Add or update tests for behaviour changes. Bug fixes should include a test that fails without the fix.
- **Small, focused commits** with imperative messages (for example, `Add Tamil phonetic typing`).

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change with tests and documentation.
3. Fill in the pull request template: what changed, why, how you tested it, and any accessibility or translation impact.
4. Include screenshots for visible changes, in light and dark themes where relevant.

## Reporting bugs

Use the bug report template and include your browser and operating system, steps to reproduce, what you expected, and whether you were online or offline. Never attach private drawings, personal information or credentials; a minimal, redacted example is enough.

Security issues must be reported privately — see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
