import { describe, expect, it } from "vitest";
import { hindiTransliterator } from "../src/editor/transliteration/hindi";
import { labelFont } from "../src/editor/labelFont";
import { translations, ui } from "../src/i18n/languages";

describe("phonetic typing ignores capital letters", () => {
  // Phone keyboards capitalise the first word of each sentence.
  it.each([
    ["Ganga", "गन्ग"],
    ["Sita", "सित"],
    ["Bachpan", "बच्पन"],
    ["KAMAL", "कमल"],
  ])("%s → %s", (roman, hindi) => {
    expect(hindiTransliterator.candidates(roman)[0]).toBe(hindi);
    expect(hindiTransliterator.candidates(roman)[0]).toBe(
      hindiTransliterator.candidates(roman.toLowerCase())[0],
    );
  });
  it("still offers the typed English word", () => {
    expect(hindiTransliterator.candidates("Ganga")).toContain("Ganga");
  });
});

describe("generated labels use the font for their script", () => {
  it.each([
    ["Storage tank", undefined, 5],
    ["पानी की टंकी", undefined, 201],
    ["पाणी", "mr", 205],
    ["నీరు", undefined, 202],
    ["জল", undefined, 203],
    ["தண்ணீர்", undefined, 204],
  ])("%s", (text, language, font) => {
    expect(labelFont(text, language)).toBe(font);
  });
});

describe("new interface text is translated", () => {
  it("has every language for the File menu, assistant and home page", () => {
    for (const key of [
      "File",
      "Diagram assistant",
      "Download backup",
      "Name your drawing",
      "Every great idea",
      "Draw and write in your own language.",
    ])
      for (const code of ["hi", "te", "bn", "ta", "mr"] as const) {
        expect(translations[key][code]).toBeTruthy();
        expect(ui(key, code)).not.toBe(key);
      }
  });
});
