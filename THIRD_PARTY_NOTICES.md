# Third-party notices

IndiDraw original code is MIT licensed. It incorporates the official @excalidraw/excalidraw package, Copyright (c) 2020 Excalidraw, MIT license. The Excalidraw package and transitive dependencies remain subject to their own copyright and license notices. React and React DOM are MIT licensed (Meta Platforms, Inc. and affiliates); Vite, Tailwind CSS and Lucide are distributed under their respective licenses (Lucide icons use ISC).

Builds self-host Excalidraw's provided fonts. Font families include Excalifont, Virgil, Cascadia, Assistant, Nunito, Comic Shanns, Lilita One and CJK fallbacks. Preserve bundled font license files; do not assume every font is covered by the application MIT license. The supplied `public/notices` directory retains font license texts and copyright metadata from official upstream sources; Noto Sans Devanagari, Telugu, Bengali and Tamil (regular and semibold, used by the canvas and the website) are SIL OFL 1.1; their license files are copied into `public/fonts` during build. See `public/fonts` after building and the exact package's distribution. Dependencies are recorded in pnpm-lock.yaml. A generated dependency license inventory is stored in docs/dependency-licenses.json.

The IndiDraw name and brand artwork belong to the project owner and are not licensed under MIT; see docs/BRANDING.md.

IndiDraw's Vite configuration adapts the bundled Excalidraw font fallback URL to the current origin, replacing the upstream esm.sh CDN fallback. Font files are unchanged. This local build adaptation is covered by the retained Excalidraw MIT notice.

The five selectable language fonts include Noto Serif Devanagari for Marathi in addition to Noto Sans for Hindi, Telugu, Bengali and Tamil. Noto Serif Devanagari is SIL OFL 1.1, Copyright 2022 The Noto Project Authors. Its full notice is retained in `public/notices/NotoSerifDevanagari-LICENSE.txt`. Custom-font registration and selected terminology overrides use the documented version-pinned adapter in `vite.config.ts`; see `docs/LOCALIZATION.md`.

Hindi phonetic typing uses @indic-transliteration/sanscript 1.3.3, MIT License, Copyright (c) 2012-present learnsanskrit.org. The full notice ships at public/notices/Sanscript-LICENSE.txt. Hindi everyday spelling preferences and the editor input adapter are IndiDraw code. No online transliteration service is used.

The installed Sanscript dependencies also retain their MIT notices: @indic-transliteration/common_maps 1.0.6, Copyright (c) 2024 Sanskrit coders; and toml 2.3.6, Copyright (c) 2012 Michelle Tilley. Full texts are retained in public/notices/Sanscript-common-maps-LICENSE.txt and Sanscript-toml-LICENSE.txt.
