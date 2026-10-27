import { FONT_FAMILY, indidrawFontRegistry } from "@excalidraw/excalidraw";
import type { ExcalidrawFontFace } from "@excalidraw/excalidraw/fonts/ExcalidrawFontFace";

export const languageFonts = [
  {
    id: 201,
    name: "Hindi Noto Sans Devanagari",
    language: "hi",
    file: "Hindi",
    script: "devanagari",
    ascender: 896,
    descender: -408,
  },
  {
    id: 202,
    name: "Telugu Noto Sans Telugu",
    language: "te",
    file: "Telugu",
    script: "telugu",
    ascender: 869,
    descender: -483,
  },
  {
    id: 203,
    name: "Bengali Noto Sans Bengali",
    language: "bn",
    file: "Bengali",
    script: "bengali",
    ascender: 917,
    descender: -408,
  },
  {
    id: 204,
    name: "Tamil Noto Sans Tamil",
    language: "ta",
    file: "Tamil",
    script: "tamil",
    ascender: 870,
    descender: -370,
  },
  {
    id: 205,
    name: "Marathi Noto Serif Devanagari",
    language: "mr",
    file: "Marathi",
    script: "devanagari",
    ascender: 930,
    descender: -625,
  },
  {
    id: 206,
    name: "Malayalam Noto Sans Malayalam",
    language: "ml",
    file: "Malayalam",
    script: "malayalam",
    ascender: 864,
    descender: -383,
  },
] as const;
const ranges = {
  devanagari:
    "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09",
  telugu:
    "U+0951-0952,U+0964-0965,U+0C00-0C7F,U+1CDA,U+1CF2,U+200C-200D,U+25CC",
  bengali:
    "U+0951-0952,U+0964-0965,U+0980-09FE,U+1CD0,U+1CD2,U+1CD5-1CD6,U+1CD8,U+1CE1,U+1CEA,U+1CED,U+1CF2,U+1CF5-1CF7,U+200C-200D,U+20B9,U+25CC,U+A8F1",
  tamil: "U+0964-0965,U+0B82-0BFA,U+200C-200D,U+20B9,U+25CC",
  malayalam:
    "U+0307,U+0323,U+0951-0952,U+0964-0965,U+0D00-0D7F,U+1CDA,U+1CF2,U+200C-200D,U+20B9,U+25CC,U+A830-A832",
};
const latinRange =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
// Run before restoration: persisted custom IDs must already be recognized.
const registry = indidrawFontRegistry.registered;
const Face = registry.get(FONT_FAMILY.Nunito)!.fontFaces[0].constructor as new (
  family: string,
  uri: string,
  descriptors?: FontFaceDescriptors,
) => ExcalidrawFontFace;
const contents = new Map<string, Promise<string>>();
function faceFor(
  font: (typeof languageFonts)[number],
  subset: string,
  range: string,
) {
  const url = `/fonts/IndiDraw${font.file}-${subset}.woff2`;
  const face = new Face(font.name, url, { unicodeRange: range });
  // Preserve complete shaping tables and avoid optional worker/eval subsetting.
  face.toCSS = async () => {
    if (!contents.has(url))
      contents.set(
        url,
        fetch(url)
          .then(async (response) => {
            if (!response.ok)
              throw new Error(
                "An Indian-language export font is unavailable. Reconnect once to finish caching fonts.",
              );
            let binary = "";
            for (const byte of new Uint8Array(await response.arrayBuffer()))
              binary += String.fromCharCode(byte);
            return btoa(binary);
          })
          .catch((error) => {
            contents.delete(url);
            throw error;
          }),
      );
    return `@font-face{font-family:${JSON.stringify(font.name)};src:url(data:font/woff2;base64,${await contents.get(url)}) format("woff2");unicode-range:${range};}`;
  };
  return face;
}
for (const font of languageFonts) {
  (FONT_FAMILY as Record<string, number>)[font.name] = font.id;
  registry.set(font.id, {
    metadata: {
      metrics: {
        unitsPerEm: 1000,
        ascender: font.ascender,
        descender: font.descender,
        lineHeight: (font.ascender - font.descender) / 1000,
      },
    },
    fontFaces: [
      faceFor(font, font.script, ranges[font.script]),
      faceFor(font, "latin", latinRange),
    ],
  });
}
