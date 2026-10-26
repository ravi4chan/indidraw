import { cp, mkdir, rm } from "node:fs/promises";
// This ignored directory contains only generated copies of dependency fonts.
await rm("public/fonts", { recursive: true, force: true });
await mkdir("public/fonts", { recursive: true });
await cp(
  "node_modules/@excalidraw/excalidraw/dist/prod/fonts",
  "public/fonts",
  { recursive: true },
);
await cp(
  "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2",
  "public/fonts/NotoDevanagari.woff2",
);
await cp(
  "node_modules/@fontsource/noto-sans-devanagari/LICENSE",
  "public/fonts/NotoDevanagari-LICENSE",
);
for (const [script, subset] of [
  ["Telugu", "telugu"],
  ["Bengali", "bengali"],
  ["Tamil", "tamil"],
]) {
  const base = `node_modules/@fontsource/noto-sans-${subset}`;
  await cp(
    `${base}/files/noto-sans-${subset}-${subset}-400-normal.woff2`,
    `public/fonts/Noto${script}.woff2`,
  );
  await cp(`${base}/LICENSE`, `public/fonts/Noto${script}-LICENSE`);
}

// Semibold faces for website headings in Indian scripts (styles.css).
for (const [script, subset] of [
  ["Devanagari", "devanagari"],
  ["Telugu", "telugu"],
  ["Bengali", "bengali"],
  ["Tamil", "tamil"],
])
  await cp(
    `node_modules/@fontsource/noto-sans-${subset}/files/noto-sans-${subset}-${subset}-600-normal.woff2`,
    `public/fonts/Noto${script}-600.woff2`,
  );

// Five selectable language fonts, including a distinct serif face for Marathi.
for (const [language, packageName, subset] of [
  ["Hindi", "noto-sans-devanagari", "devanagari"],
  ["Telugu", "noto-sans-telugu", "telugu"],
  ["Bengali", "noto-sans-bengali", "bengali"],
  ["Tamil", "noto-sans-tamil", "tamil"],
  ["Marathi", "noto-serif-devanagari", "devanagari"],
]) {
  const base = `node_modules/@fontsource/${packageName}`;
  for (const script of [subset, "latin"])
    await cp(
      `${base}/files/${packageName}-${script}-400-normal.woff2`,
      `public/fonts/IndiDraw${language}-${script}.woff2`,
    );
  await cp(`${base}/LICENSE`, `public/fonts/IndiDraw${language}-LICENSE`);
}
