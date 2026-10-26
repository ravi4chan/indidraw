import { describe, it, expect } from "vitest";
import {
  languageOptions,
  translations,
  ui,
  initialLanguage,
} from "../src/i18n/languages";
describe("language selection", () => {
  it("uses English by default without browser storage", () =>
    expect(initialLanguage()).toBe("en"));
  it("includes exactly the six requested options", () =>
    expect(languageOptions.map((l) => l.code)).toEqual([
      "en",
      "hi",
      "te",
      "bn",
      "ta",
      "mr",
    ]));
  it("has every custom translation for all six options", () => {
    for (const row of Object.values(translations))
      for (const language of languageOptions)
        expect(row[language.code].trim().length).toBeGreaterThan(0);
  });
  it("falls back safely for an untranslated advanced message", () =>
    expect(ui("Advanced example", "te")).toBe("Advanced example"));
});
