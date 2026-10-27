import { describe, expect, it, vi } from "vitest";
import { extractStrings } from "./i18nExtract";
import {
  languageOptions,
  translations,
  ui,
  uiFill,
} from "../src/i18n/languages";
import { terminology } from "../src/i18n/editorTerms";

// Brand names, symbols, font and language names stay as written; the legal
// pages are English-only and say so in every language.
const untranslated = new Set([
  "IndiDraw",
  "IndiDraw.",
  "INDIDRAW",
  "INDIDRAW /",
  "GitHub",
  "GitHub ↗",
  "— &nbsp;━ &nbsp;▬",
  "╱ &nbsp;∿ &nbsp;〰",
  "Your ideas stay yours.",
  "Simple tools. Clear terms.",
  "Open by design.",
  "Make room for better ideas.",
  ...["Devanagari", "Telugu", "Bengali", "Tamil", "Malayalam"],
  ...languageOptions.map((l) => l.label),
]);
const fontFile = /editor\/(indicFonts|languageFonts)\.ts$/;
const root = new URL("..", import.meta.url).pathname;

describe("every interface string is translated", () => {
  const found = extractStrings(root).filter(
    (f) => !untranslated.has(f.text) && !fontFile.test(f.file),
  );
  it("finds the interface strings", () =>
    expect(found.length).toBeGreaterThan(250));
  it("has a translation in all seven languages", () => {
    const missing = found
      .filter(
        (f) =>
          !languageOptions.every(
            (l) =>
              (
                terminology[f.text]?.[l.code] ?? translations[f.text]?.[l.code]
              )?.trim().length,
          ),
      )
      .map((f) => `${f.file}: ${f.text}`);
    expect(missing.join("\n")).toBe("");
  });
  it("keeps every {placeholder} in each translation", () => {
    for (const [english, row] of Object.entries(translations)) {
      const names = (english.match(/\{\w+\}/g) ?? []).sort();
      for (const l of languageOptions)
        expect((row[l.code].match(/\{\w+\}/g) ?? []).sort(), english).toEqual(
          names,
        );
    }
  });
  it("fills placeholders after translating", () =>
    expect(
      uiFill("A shape called “{name}” already exists.", { name: "Tank" }, "ml"),
    ).toBe("“Tank” എന്ന രൂപം ഇതിനകം ഉണ്ട്."));
  it("falls back to English for unknown text", () =>
    expect(ui("Advanced example", "ml")).toBe("Advanced example"));
});

describe("editor terms for Telugu and Malayalam", () => {
  async function editorTermIn(language: string) {
    vi.resetModules();
    vi.stubGlobal("localStorage", {
      getItem: () => language,
      setItem: () => undefined,
    });
    const { editorTerm } = await import("../src/i18n/editorTerms");
    vi.unstubAllGlobals();
    return editorTerm;
  }
  it("translates tools and fills {{placeholders}}", async () => {
    const te = await editorTermIn("te");
    expect(te("toolBar.rectangle")).toBe("దీర్ఘచతురస్రం");
    const ml = await editorTermIn("ml");
    expect(ml("toolBar.rectangle")).toBe("ദീർഘചതുരം");
    expect(ml("alerts.removeItemsFromsLibrary", { count: 3 })).toBe(
      "ലൈബ്രറിയിൽ നിന്ന് 3 ഇനങ്ങൾ ഇല്ലാതാക്കണോ?",
    );
    expect(ml("buttons.export")).toBe("എക്സ്പോർട്ട്");
  });
  it("leaves English to the editor", async () =>
    expect((await editorTermIn("en"))("toolBar.rectangle")).toBeUndefined());
});
