import Sanscript from "@indic-transliteration/sanscript";
import { hindiTransliterator, type Transliterator } from "./hindi";
import { dictionaries } from "./dictionaries";

/**
 * Offline phonetic typing for Indian scripts: everyday "English letter"
 * spellings (amma, pustakam, ente, bangla) become native Unicode.
 *
 * Hindi and Marathi keep the reviewed ITRANS/Sanscript Devanagari engine.
 * Telugu, Tamil, Bengali and Malayalam use the rule engine below, because the
 * way people casually romanise them differs from ITRANS: Bengali "o" is the
 * inherent vowel, Tamil has no aspirates, Malayalam ends words in chillu
 * letters, Telugu writes a final "m" as an anusvara. Every rule-built word is
 * a pronunciation, never a translation, and each language also has a small
 * dictionary of real words whose spelling rules alone cannot guess.
 */
export const phoneticLanguages = ["hi", "te", "bn", "ta", "mr", "ml"] as const;
export type PhoneticLanguage = (typeof phoneticLanguages)[number];

const VIRAMA = 0x4d;
const ANUSVARA = 0x02;
type Vowel =
  "A" | "AA" | "I" | "II" | "U" | "UU" | "E" | "EE" | "AI" | "O" | "OO" | "AU";
// [independent letter, vowel sign] offsets from a script's Unicode block. The
// Indian blocks share the ISCII layout, so one table serves every script.
const vowelOffsets: Record<Vowel, [number, number | null]> = {
  A: [0x05, null],
  AA: [0x06, 0x3e],
  I: [0x07, 0x3f],
  II: [0x08, 0x40],
  U: [0x09, 0x41],
  UU: [0x0a, 0x42],
  E: [0x0e, 0x46], // short e (Dravidian)
  EE: [0x0f, 0x47],
  AI: [0x10, 0x48],
  O: [0x12, 0x4a], // short o (Dravidian)
  OO: [0x13, 0x4b],
  AU: [0x14, 0x4c],
};
const vowelSpellings: [string, Vowel][] = [
  ["aa", "AA"],
  ["ai", "AI"],
  ["au", "AU"],
  ["ou", "AU"],
  ["ii", "II"],
  ["ee", "II"],
  ["uu", "UU"],
  ["oo", "UU"],
  ["A", "AA"],
  ["I", "II"],
  ["U", "UU"],
  ["E", "EE"],
  ["O", "OO"],
  ["a", "A"],
  ["i", "I"],
  ["u", "U"],
  ["e", "E"],
  ["o", "O"],
];
// Latin consonant keys, longest first, to Devanagari-layout offsets.
const consonantSpellings: [string, number][] = [
  ["chh", 0x1b],
  ["thh", 0x25],
  ["ksh", -1],
  ["kh", 0x16],
  ["gh", 0x18],
  ["ng", 0x19],
  ["ch", 0x1a],
  ["jh", 0x1d],
  ["nj", 0x1e],
  ["ny", 0x1e],
  ["Th", 0x20],
  ["Dh", 0x22],
  ["th", 0x25],
  ["dh", 0x27],
  ["ph", 0x2b],
  ["bh", 0x2d],
  ["Sh", 0x37],
  ["sh", 0x36],
  ["zh", 0x34],
  ["k", 0x15],
  ["q", 0x15],
  ["g", 0x17],
  ["c", 0x1a],
  ["j", 0x1c],
  ["T", 0x1f],
  ["D", 0x21],
  ["N", 0x23],
  ["t", 0x24],
  ["d", 0x26],
  ["n", 0x28],
  ["p", 0x2a],
  ["f", 0x2b],
  ["b", 0x2c],
  ["m", 0x2e],
  ["y", 0x2f],
  ["r", 0x30],
  ["R", 0x31],
  ["l", 0x32],
  ["L", 0x33],
  ["v", 0x35],
  ["w", 0x35],
  ["s", 0x38],
  ["h", 0x39],
  ["z", 0x1c],
  ["x", -1],
];
type Token =
  | { kind: "C"; key: string; offset: number }
  | { kind: "V"; key: string; vowel: Vowel };

export function tokenize(word: string, spellings = vowelSpellings): Token[] {
  const tokens: Token[] = [];
  let rest = word;
  while (rest) {
    const vowel = spellings.find(([latin]) => rest.startsWith(latin));
    const consonant = consonantSpellings.find(([latin]) =>
      rest.startsWith(latin),
    );
    // Prefer the longer match; ties go to vowels ("aa" over "a").
    if (vowel && (!consonant || vowel[0].length >= consonant[0].length)) {
      tokens.push({ kind: "V", key: vowel[0], vowel: vowel[1] });
      rest = rest.slice(vowel[0].length);
    } else if (consonant) {
      tokens.push({ kind: "C", key: consonant[0], offset: consonant[1] });
      rest = rest.slice(consonant[0].length);
    } else if (rest[0] !== rest[0].toLowerCase()) {
      // An unmapped capital (K, P, …) means the same as its lowercase letter.
      rest = rest[0].toLowerCase() + rest.slice(1);
    } else rest = rest.slice(1);
  }
  return tokens;
}

interface Context {
  tokens: Token[];
  index: number;
  prev?: Token;
  next?: Token;
  initial: boolean;
}
interface Script {
  base: number;
  vowels?: [string, Vowel][];
  /** Characters for one consonant, or a vowel-less sound such as anusvara. */
  consonant(token: Token & { kind: "C" }, ctx: Context): string;
  /** Vowel to use for a latin vowel spelling in this position. */
  vowel?(token: Token & { kind: "V" }, ctx: Context): Vowel;
  /** Spelling for a consonant that ends the word with no vowel. */
  final?(consonant: string, token: Token & { kind: "C" }): string;
}

const isC = (t?: Token): t is Token & { kind: "C" } => t?.kind === "C";
const isV = (t?: Token): t is Token & { kind: "V" } => t?.kind === "V";

function render(word: string, script: Script): string {
  const char = (offset: number) => String.fromCharCode(script.base + offset);
  const tokens = tokenize(word, script.vowels);
  let out = "";
  tokens.forEach((token, index) => {
    const ctx: Context = {
      tokens,
      index,
      prev: tokens[index - 1],
      next: tokens[index + 1],
      initial: index === 0,
    };
    if (token.kind === "V") {
      const vowel = script.vowel?.(token, ctx) ?? token.vowel;
      const [independent, sign] = vowelOffsets[vowel];
      if (isC(ctx.prev) && out && !out.endsWith(char(ANUSVARA))) {
        if (sign !== null) out += char(sign);
      } else out += char(independent);
      return;
    }
    const letters = script.consonant(token, ctx);
    out += letters;
    // A consonant that ends in a vowel-less mark (anusvara) needs no virama.
    if (letters.endsWith(char(ANUSVARA)) || letters === "") return;
    if (isC(ctx.next)) out += char(VIRAMA);
    else if (!ctx.next) {
      const finished = script.final
        ? script.final(letters, token)
        : letters + char(VIRAMA);
      out = out.slice(0, out.length - letters.length) + finished;
    }
  });
  return out;
}

const at = (base: number) => (offset: number) =>
  String.fromCharCode(base + offset);
const nextIsVowel = (ctx: Context) => isV(ctx.next);
const followingConsonant = (ctx: Context) =>
  isC(ctx.next) ? ctx.next : undefined;

// --- Telugu ---------------------------------------------------------------
const te = at(0x0c00);
const telugu: Script = {
  base: 0x0c00,
  consonant(token, ctx) {
    const after = followingConsonant(ctx);
    if (token.key === "ksh" || token.key === "x")
      return te(0x15) + te(VIRAMA) + te(0x37);
    if (token.key === "ng")
      return te(ANUSVARA) + (nextIsVowel(ctx) ? te(0x17) : "");
    // n/m before another consonant, or a final m, is written as anusvara.
    if (
      (token.key === "n" || token.key === "m") &&
      ((after && after.key !== token.key && !/^[yrlvwh]$/.test(after.key)) ||
        (token.key === "m" && !ctx.next))
    )
      return te(ANUSVARA);
    // Doubled t is retroflex (chettu, pattu); a single t stays dental.
    if (
      token.key === "t" &&
      !ctx.initial &&
      (ctx.next?.key === "t" || ctx.prev?.key === "t")
    )
      return te(0x1f);
    if (token.key === "zh") return te(0x33);
    // Everyday Telugu spelling uses "th" for dental త (thammudu); thh is థ.
    if (token.key === "th") return te(0x24);
    return te(token.offset);
  },
};

// --- Tamil ----------------------------------------------------------------
const ta = at(0x0b80);
const tamil: Script = {
  base: 0x0b80,
  consonant(token, ctx) {
    const k = token.key;
    if (k === "ksh" || k === "x") return ta(0x15) + ta(VIRAMA) + ta(0x37);
    if (["k", "kh", "g", "gh", "q"].includes(k)) return ta(0x15);
    if (k === "ng")
      return ta(0x19) + (nextIsVowel(ctx) ? ta(VIRAMA) + ta(0x15) : "");
    if (k === "nj")
      return ta(0x1e) + (nextIsVowel(ctx) ? ta(VIRAMA) + ta(0x1a) : "");
    if (k === "ny") return ta(0x1e);
    if (["ch", "chh", "c", "s"].includes(k)) return ta(0x1a);
    if (["j", "jh", "z"].includes(k)) return ta(0x1c);
    if (["th", "thh", "dh"].includes(k)) return ta(0x24);
    if (["T", "Th", "D", "Dh"].includes(k)) return ta(0x1f);
    if (k === "t" || k === "d") {
      if (ctx.next?.key === "r") return ta(0x31); // kaatru → காற்று
      return ctx.initial ? ta(0x24) : ta(0x1f);
    }
    if (k === "n") {
      if (ctx.initial) return ta(0x28);
      if (["th", "dh", "thh"].includes(ctx.next?.key ?? "")) return ta(0x28);
      return ta(0x29); // ன: final and medial n
    }
    if (["p", "ph", "f", "b", "bh"].includes(k)) return ta(0x2a);
    if (["sh", "Sh"].includes(k)) return ta(0x37);
    if (k === "r" && ["n", "t", "d", "r", "R"].includes(ctx.prev?.key ?? ""))
      return ta(0x31);
    if (k === "r" && ctx.next?.key === "r") return ta(0x31);
    if (k === "R") return ta(0x31);
    return ta(token.offset);
  },
  vowel(token, ctx) {
    // Tamil words rarely end in a short a: amma/appa are அம்மா/அப்பா.
    if (token.key === "a" && !ctx.next && isC(ctx.prev) && ctx.index > 1)
      return "AA";
    return token.vowel;
  },
};

// --- Malayalam ------------------------------------------------------------
const ml = at(0x0d00);
const chillu: Record<string, string> = {
  n: "\u0d7b",
  N: "\u0d7a",
  r: "\u0d7c",
  l: "\u0d7d",
  L: "\u0d7e",
};
const malayalam: Script = {
  base: 0x0d00,
  consonant(token, ctx) {
    const k = token.key;
    if (k === "ksh" || k === "x") return ml(0x15) + ml(VIRAMA) + ml(0x37);
    if (k === "ng")
      return ml(0x19) + (nextIsVowel(ctx) ? ml(VIRAMA) + ml(0x19) : "");
    if (k === "n" && ctx.next?.key === "k") return ml(0x19); // sankadam
    if (k === "t" || k === "T") {
      if (ctx.prev?.key === "n") return ml(0x31); // ente → എന്റെ
      return ml(0x1f);
    }
    if (k === "Th") return ml(0x20);
    if (k === "th") return ml(0x24);
    if (k === "thh") return ml(0x25);
    if (k === "z") return ml(0x38);
    if (k === "m" && !ctx.next) return ml(ANUSVARA);
    return ml(token.offset);
  },
  final(letters, token) {
    return chillu[token.key] ?? letters + ml(VIRAMA);
  },
};

// --- Bengali --------------------------------------------------------------
const bn = at(0x0980);
const bengali: Script = {
  base: 0x0980,
  consonant(token, ctx) {
    const k = token.key;
    if (k === "ksh" || k === "x") return bn(0x15) + bn(VIRAMA) + bn(0x37);
    if (k === "ng")
      return nextIsVowel(ctx) ? bn(0x19) + bn(VIRAMA) + bn(0x17) : bn(ANUSVARA);
    if (k === "ny") return bn(0x28) + bn(VIRAMA) + bn(0x2f); // dhonnyobad
    if (k === "v" || k === "w") return bn(0x2c);
    if (k === "z") return bn(0x2f);
    if (k === "y" && isV(ctx.prev)) return "\u09df"; // য় after a vowel
    if (k === "R") return "\u09dc"; // ড়
    if (k === "L") return bn(0x32);
    if (k === "zh") return bn(0x1d);
    return bn(token.offset);
  },
  vowel(token, ctx) {
    // Everyday Bengali spelling (as in Avro): "a" is া, "o" is the inherent
    // vowel inside a word and ো at its end; "oi" is ৈ.
    if (token.key === "a") return "AA";
    if (token.key === "o")
      return isC(ctx.prev) && ctx.next ? "A" : ctx.initial ? "A" : "OO";
    if (token.key === "e") return "EE";
    if (token.key === "O") return "OO";
    return token.vowel;
  },
  // Bengali writes a final consonant without hasanta: জল, ঘর.
  final: (letters) => letters,
  // "oi" is ৈ (boi, the common বই, is a dictionary word).
  vowels: [["oi", "AI"], ...vowelSpellings],
};

const scripts: Record<Exclude<PhoneticLanguage, "hi" | "mr">, Script> = {
  te: telugu,
  ta: tamil,
  ml: malayalam,
  bn: bengali,
};

/** Phone keyboards capitalise sentence starts; mid-word capitals are letters. */
export function normalise(word: string): string {
  if (
    word === word.toUpperCase() ||
    word.slice(1) === word.slice(1).toLowerCase()
  )
    return word.toLowerCase();
  return word;
}

const ruleSpelling = (language: keyof typeof scripts, word: string) =>
  render(word, scripts[language]);

// Simple alternates for spellings people mean either way: dental/retroflex
// t, d, n, l and short/long e, o.
const alternates = (word: string) => [
  word.replace(/t(?!h)/g, "T"),
  word.replace(/d(?!h)/g, "D"),
  word.replace(/n(?![gjy])/g, "N"),
  word.replace(/l/g, "L"),
  word.replace(/e/g, "E").replace(/o/g, "O"),
];

function ruleTransliterator(language: keyof typeof scripts): Transliterator {
  return {
    language,
    candidates(word) {
      if (!/^[a-z]+$/i.test(word)) return [word];
      const spelling = normalise(word);
      const lower = word.toLowerCase();
      const primary = ruleSpelling(language, spelling);
      const extra = alternates(spelling)
        .filter((variant) => variant !== spelling)
        .map((variant) => ruleSpelling(language, variant));
      return [
        ...new Set([
          ...(dictionaries[language][lower] ?? []),
          primary,
          ...extra,
          word,
        ]),
      ].filter(Boolean);
    },
  };
}

const marathiTransliterator: Transliterator = {
  language: "mr",
  candidates(word) {
    if (!/^[a-z]+$/i.test(word)) return [word];
    const lower = word.toLowerCase();
    const phonetic = lower.replace(/ksh/g, "kSh").replace(/chh/g, "Ch");
    const fallback = Sanscript.t(phonetic, "itrans", "devanagari", {
      syncope: true,
    });
    return [...new Set([...(dictionaries.mr[lower] ?? []), fallback, word])];
  },
};

export const transliterators: Record<PhoneticLanguage, Transliterator> = {
  hi: hindiTransliterator,
  mr: marathiTransliterator,
  te: ruleTransliterator("te"),
  ta: ruleTransliterator("ta"),
  bn: ruleTransliterator("bn"),
  ml: ruleTransliterator("ml"),
};
export const isPhoneticLanguage = (value: string): value is PhoneticLanguage =>
  (phoneticLanguages as readonly string[]).includes(value);
