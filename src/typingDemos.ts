import type { LanguageCode } from "./i18n/languages";
// What the home page's typing demo shows for each app language. Every pair is
// the phonetic keyboard's first suggestion (checked in tests/typingDemos.test.ts).
export const typingDemos: Record<
  Exclude<LanguageCode, "en">,
  readonly (readonly [string, string])[]
> = {
  hi: [
    ["namaste", "नमस्ते"],
    ["bharat", "भारत"],
    ["vidyalaya", "विद्यालय"],
    ["paani", "पानी"],
  ],
  te: [
    ["telugu", "తెలుగు"],
    ["pustakam", "పుస్తకం"],
    ["illu", "ఇల్లు"],
    ["nenu", "నేను"],
  ],
  bn: [
    ["bangla", "বাংলা"],
    ["ami", "আমি"],
    ["bhalo", "ভালো"],
    ["kolkata", "কলকাতা"],
  ],
  ta: [
    ["vanakkam", "வணக்கம்"],
    ["tamizh", "தமிழ்"],
    ["maram", "மரம்"],
    ["chennai", "சென்னை"],
  ],
  mr: [
    ["ghar", "घर"],
    ["pustak", "पुस्तक"],
    ["mitra", "मित्र"],
    ["paani", "पाणी"],
  ],
  ml: [
    ["malayalam", "മലയാളം"],
    ["maram", "മരം"],
    ["avan", "അവൻ"],
    ["sundaram", "സുന്ദരം"],
  ],
};
/** English shows one word from each language in turn. */
export function demoFor(language: LanguageCode) {
  return language === "en"
    ? Object.values(typingDemos).map((pairs) => pairs[0])
    : typingDemos[language];
}
