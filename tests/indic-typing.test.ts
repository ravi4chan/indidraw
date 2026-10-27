import { describe, expect, it } from "vitest";
import {
  phoneticLanguages,
  transliterators,
} from "../src/editor/transliteration/indic";
import {
  defaultTypingMode,
  engineFor,
  isTypingMode,
  loadTypingMode,
  saveTypingMode,
  typingLanguage,
  typingModes,
} from "../src/editor/transliteration/typingMode";
import { demoFor, typingDemos } from "../src/typingDemos";
import { languageOptions } from "../src/i18n/languages";

// Real everyday words typed the way people spell them in English letters.
const words = {
  hi: [
    ["namaste", "नमस्ते"],
    ["bharat", "भारत"],
    ["paani", "पानी"],
  ],
  te: [
    ["telugu", "తెలుగు"],
    ["illu", "ఇల్లు"],
    ["pustakam", "పుస్తకం"],
    ["chettu", "చెట్టు"],
    ["kampu", "కంపు"],
    ["vidya", "విద్య"],
    ["nenu", "నేను"],
  ],
  ta: [
    ["tamizh", "தமிழ்"],
    ["pazham", "பழம்"],
    ["chennai", "சென்னை"],
    ["nanri", "நன்றி"],
    ["kadal", "கடல்"],
    ["appa", "அப்பா"],
    ["singam", "சிங்கம்"],
    ["kaatru", "காற்று"],
    ["kuzhandhai", "குழந்தை"],
    ["vanakkam", "வணக்கம்"],
  ],
  bn: [
    ["ami", "আমি"],
    ["amar", "আমার"],
    ["bangla", "বাংলা"],
    ["jol", "জল"],
    ["bhalo", "ভালো"],
    ["kemon", "কেমন"],
    ["kotha", "কথা"],
    ["nouka", "নৌকা"],
  ],
  mr: [
    ["ghar", "घर"],
    ["pustak", "पुस्तक"],
    ["mitra", "मित्र"],
    ["paani", "पाणी"],
  ],
  ml: [
    ["avan", "അവൻ"],
    ["maram", "മരം"],
    ["ente", "എന്റെ"],
    ["thiruvananthapuram", "തിരുവനന്തപുരം"],
    ["engane", "എങ്ങനെ"],
    ["kadal", "കടൽ"],
    ["pakal", "പകൽ"],
    ["malayalam", "മലയാളം"],
  ],
} as const;

describe.each(phoneticLanguages)("%s phonetic typing", (code) => {
  const engine = transliterators[code];
  it.each(words[code].map(([roman, native]) => [roman, native]))(
    "%s → %s",
    (roman, native) => {
      expect(engine.candidates(roman)[0]).toBe(native);
      // Capitalised words (sentence starts) give the same script.
      const capital = roman[0].toUpperCase() + roman.slice(1);
      expect(engine.candidates(capital)[0]).toBe(native);
    },
  );
  it("always offers the English letters as a way out", () => {
    for (const [roman] of words[code])
      expect(engine.candidates(roman)).toContain(roman);
  });
  it("passes script, numbers and punctuation through unchanged", () => {
    for (const text of ["नमस्ते", "123", "a.b", ""])
      expect(engine.candidates(text)).toEqual([text]);
  });
});

describe("homepage typing demos", () => {
  it.each(
    Object.entries(typingDemos).flatMap(([code, pairs]) =>
      pairs.map(([roman, native]) => [code, roman, native]),
    ),
  )("%s: %s matches the engine (%s)", (code, roman, native) => {
    expect(
      transliterators[code as keyof typeof transliterators].candidates(
        roman,
      )[0],
    ).toBe(native);
  });
  it("English shows one word from every language", () =>
    expect(demoFor("en")).toHaveLength(phoneticLanguages.length));
});

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("typing language follows the app language", () => {
  it.each(languageOptions.map((l) => l.code))(
    "%s picks its own keyboard by default",
    (code) => {
      const mode = defaultTypingMode(code);
      expect(isTypingMode(mode)).toBe(true);
      expect(typingLanguage(mode)).toBe(code === "en" ? null : code);
      expect(engineFor(mode)).toBe(
        code === "en" ? null : transliterators[code as "hi"],
      );
    },
  );
  it("device keyboards are never rewritten", () => {
    for (const mode of typingModes.filter((m) => m.endsWith("-native")))
      expect(engineFor(mode)).toBeNull();
  });
  it("remembers a different choice per app language across reloads", () => {
    const storage = memoryStorage();
    saveTypingMode("ta", "ta-native", storage);
    saveTypingMode("hi", "english", storage);
    expect(loadTypingMode("ta", storage)).toBe("ta-native");
    expect(loadTypingMode("hi", storage)).toBe("english");
    expect(loadTypingMode("ml", storage)).toBe("ml-phonetic");
  });
  it("ignores corrupt or unknown saved values", () => {
    const storage = memoryStorage();
    storage.setItem("indidraw-typing-modes", "{not json");
    expect(loadTypingMode("bn", storage)).toBe("bn-phonetic");
    storage.setItem("indidraw-typing-modes", '{"te":"xx-phonetic"}');
    expect(loadTypingMode("te", storage)).toBe("te-phonetic");
  });
  it("works without storage", () => {
    saveTypingMode("mr", "english", null);
    expect(loadTypingMode("mr", null)).toBe("mr-phonetic");
  });
});
