// Supplement upstream families only for the requested Indic scripts.
const families = [
  "Excalifont",
  "Virgil",
  "Helvetica",
  "Cascadia",
  "Nunito",
  "Comic Shanns",
  "Lilita One",
  "IndiDraw Indic",
  "Assistant",
];
export const indicScripts = [
  {
    name: "Devanagari",
    range:
      "U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A8E0-A8FF",
    match: /[\u0900-\u097f]/,
  },
  { name: "Telugu", range: "U+0C00-0C7F", match: /[\u0c00-\u0c7f]/ },
  { name: "Bengali", range: "U+0980-09FF", match: /[\u0980-\u09ff]/ },
  { name: "Tamil", range: "U+0B80-0BFF", match: /[\u0b80-\u0bff]/ },
  { name: "Malayalam", range: "U+0D00-0D7F", match: /[\u0d00-\u0d7f]/ },
];
let loading: Promise<void> | undefined;
export function loadIndicFonts(): Promise<void> {
  if (!loading)
    loading = Promise.all(
      indicScripts.flatMap((script) =>
        families.map(async (family) => {
          const face = new FontFace(
            family,
            `url(/fonts/Noto${script.name}.woff2)`,
            { unicodeRange: script.range },
          );
          await face.load();
          document.fonts.add(face);
        }),
      ),
    )
      .then(() => undefined)
      .catch((error) => {
        loading = undefined;
        throw error;
      });
  return loading;
}
export async function embedIndicFonts(svg: SVGSVGElement) {
  const text = svg.textContent ?? "";
  const rules = await Promise.all(
    indicScripts
      .filter((script) => script.match.test(text))
      .map(async (script) => {
        const response = await fetch(`/fonts/Noto${script.name}.woff2`);
        if (!response.ok)
          throw new Error(
            "An Indian-language export font is unavailable. Reconnect once to finish caching fonts.",
          );
        let binary = "";
        for (const byte of new Uint8Array(await response.arrayBuffer()))
          binary += String.fromCharCode(byte);
        const encoded = btoa(binary);
        return families
          .map(
            (family) =>
              `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${encoded}) format("woff2");unicode-range:${script.range};}`,
          )
          .join("\n");
      }),
  );
  if (rules.length) {
    const style = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    );
    style.textContent = rules.join("\n");
    svg.prepend(style);
  }
}
