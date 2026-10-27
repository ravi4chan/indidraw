import {
  isPhoneticLanguage,
  phoneticLanguages,
  transliterators,
  type PhoneticLanguage,
} from "./indic";
import type { Transliterator } from "./hindi";
import type { TypingMode } from "./input";

export const typingModes: TypingMode[] = [
  "english",
  ...phoneticLanguages.map((code) => `${code}-phonetic` as const),
  ...phoneticLanguages.map((code) => `${code}-native` as const),
];
export const isTypingMode = (value: unknown): value is TypingMode =>
  typingModes.includes(value as TypingMode);

/** The script a mode writes, or null for plain English letters. */
export function typingLanguage(mode: TypingMode): PhoneticLanguage | null {
  const code = mode.split("-")[0];
  return isPhoneticLanguage(code) ? code : null;
}
export function engineFor(mode: TypingMode): Transliterator | null {
  const language = typingLanguage(mode);
  return language && mode.endsWith("-phonetic")
    ? transliterators[language]
    : null;
}

/**
 * The app language picks the keyboard: choosing Tamil types Tamil. A
 * different keyboard picked while using a language is remembered for that
 * language only, so the two never drift apart across reloads.
 */
export function defaultTypingMode(language: string): TypingMode {
  return isPhoneticLanguage(language) ? `${language}-phonetic` : "english";
}
const storageKey = "indidraw-typing-modes";
type Store = Pick<Storage, "getItem" | "setItem">;
const browserStorage = (): Store | null => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};
function read(storage: Store | null): Record<string, unknown> {
  try {
    const value = JSON.parse(storage?.getItem(storageKey) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
export function loadTypingMode(
  language: string,
  storage: Store | null = browserStorage(),
): TypingMode {
  const saved = read(storage)[language];
  return isTypingMode(saved) ? saved : defaultTypingMode(language);
}
export function saveTypingMode(
  language: string,
  mode: TypingMode,
  storage: Store | null = browserStorage(),
) {
  try {
    storage?.setItem(
      storageKey,
      JSON.stringify({ ...read(storage), [language]: mode }),
    );
  } catch {
    /* The keyboard still works for this visit without storage. */
  }
}
