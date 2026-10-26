import { describe, expect, it } from "vitest";
import { hindiTransliterator } from "../src/editor/transliteration/hindi";

describe("everyday Hindi phonetic spellings (not translation)", () => {
  it.each([
    ["namaste", "नमस्ते"],
    ["bharat", "भारत"],
    ["Bharat", "भारत"],
    ["mera", "मेरा"],
    ["naam", "नाम"],
    ["hindi", "हिंदी"],
    ["main", "मैं"],
    ["hoon", "हूँ"],
    ["hain", "हैं"],
    ["aap", "आप"],
    ["kaise", "कैसे"],
    ["kya", "क्या"],
    ["nahi", "नहीं"],
    ["dhanyavad", "धन्यवाद"],
    ["kripya", "कृपया"],
    ["shiksha", "शिक्षा"],
    ["gyan", "ज्ञान"],
    ["shraddha", "श्रद्धा"],
    ["swatantrata", "स्वतंत्रता"],
    ["rashtriya", "राष्ट्रीय"],
    ["paani", "पानी"],
    ["duniya", "दुनिया"],
    ["achha", "अच्छा"],
    ["prarthana", "प्रार्थना"],
    ["drishti", "दृष्टि"],
    ["pyaar", "प्यार"],
  ])("%s → %s", (roman, hindi) => {
    expect(hindiTransliterator.candidates(roman)[0]).toBe(hindi);
  });
  it("offers ambiguous alternatives and a way to keep English", () => {
    expect(hindiTransliterator.candidates("bharat")).toContain("भरत");
    expect(hindiTransliterator.candidates("ki")).toContain("कि");
    expect(hindiTransliterator.candidates("bharat")).toContain("bharat");
  });
  it.each(["नमस्ते", "क्षि", "English भारत", "123", "a.b", ""])(
    "passes nonwords through: %s",
    (text) => {
      expect(hindiTransliterator.candidates(text)).toEqual([text]);
    },
  );
});
