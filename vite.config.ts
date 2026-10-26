import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
const editorDependencies = Object.keys(
  JSON.parse(
    readFileSync(
      new URL(
        "./node_modules/@excalidraw/excalidraw/package.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).dependencies,
).map((name) => `@excalidraw/excalidraw > ${name}`);
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "indidraw-local-font-fallback",
      enforce: "pre",
      transform(code, id) {
        if (!id.includes("@excalidraw/excalidraw/dist/")) return;
        // Upstream appends this CDN even with EXCALIDRAW_ASSET_PATH set.
        // Keep its fallback on our origin as all font assets ship locally.
        const start = code.indexOf("`https://esm.sh/");
        if (start >= 0) {
          const suffix = "/dist/prod/`";
          const end = code.indexOf(suffix, start);
          if (end < 0)
            throw new Error("Review upstream font fallback before building.");
          code =
            code.slice(0, start) +
            'new URL("/", window.location.origin).href' +
            code.slice(end + suffix.length);
        }
        // Version-pinned adapter: expose the existing registry so custom fonts
        // use the native picker, restoration, metrics and export pipeline.
        if (/\/dist\/(prod|dev)\/index\.js(?:\?.*)?$/.test(id)) {
          const registry = code.match(
            /Array\.from\(([\w$]+)\.registered\.entries\(\)\)/,
          )?.[1];
          if (!registry)
            throw new Error(
              "Review Excalidraw custom-font adapter before building.",
            );
          code += `\nexport const indidrawFontRegistry = ${registry};\n`;
          const translator = code.includes(
            "var t = (path, replacement, fallback) => {",
          )
            ? "t"
            : code.match(/return\s*\{\s*t:\s*([\w$]+),\s*langCode/)?.[1];
          if (!translator)
            throw new Error(
              "Review editor terminology adapter before building.",
            );
          const declaration = new RegExp(
            `\\b${translator}\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*\\{`,
          );
          const match = code.match(declaration);
          if (!match) throw new Error("Editor translator signature changed.");
          const key = match[1].split(",")[0].trim();
          code = code.replace(
            declaration,
            `${match[0]}const __indidrawTerm=__indidrawEditorTerm(${key});if(__indidrawTerm!==undefined)return __indidrawTerm;`,
          );
          code =
            `import {editorTerm as __indidrawEditorTerm} from ${JSON.stringify(new URL("./src/i18n/editorTerms.ts", import.meta.url).pathname)};\n` +
            code;
        }
        return { code, map: null };
      },
    },
  ],
  build: { chunkSizeWarningLimit: 1800 },
  optimizeDeps: {
    exclude: ["@excalidraw/excalidraw"],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      ...editorDependencies,
    ],
  },
  server: { port: 5173 },
});
