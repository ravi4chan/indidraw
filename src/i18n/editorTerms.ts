import { editorLocales } from "./editorLocales";
// Researched terminology plus deliberate transliterations; see docs/LOCALIZATION.md.
const terms = [
  ["New", "नया", "కొత్తది", "নতুন", "புதியது", "नवीन", "പുതിയത്"],
  ["Open", "खोलें", "తెరవండి", "খুলুন", "திற", "उघडा", "തുറക്കുക"],
  [
    "Templates",
    "टेम्प्लेट",
    "టెంప్లేట్లు",
    "টেমপ্লেট",
    "டெம்ப்ளேட்கள்",
    "टेम्प्लेट",
    "ടെംപ്ലേറ്റുകൾ",
  ],
  [
    "Import",
    "इंपोर्ट",
    "ఇంపోర్ట్",
    "ইমপোর্ট",
    "இம்போர்ட்",
    "इम्पोर्ट",
    "ഇംപോർട്ട്",
  ],
  [
    "Export",
    "एक्सपोर्ट",
    "ఎక్స్‌పోర్ట్",
    "এক্সপোর্ট",
    "எக்ஸ்போர்ட்",
    "एक्सपोर्ट",
    "എക്സ്പോർട്ട്",
  ],
  [
    "Stroke",
    "स्ट्रोक",
    "స్ట్రోక్",
    "স্ট্রোক",
    "ஸ்ட்ரோக்",
    "स्ट्रोक",
    "സ്ട്രോക്ക്",
  ],
  [
    "Font size",
    "फ़ॉन्ट साइज़",
    "ఫాంట్ సైజు",
    "ফন্টের আকার",
    "எழுத்துரு அளவு",
    "फॉन्ट आकार",
    "ഫോണ്ട് വലുപ്പം",
  ],
  ["Font family", "फ़ॉन्ट", "ఫాంట్", "ফন্ট", "எழுத்துரு", "फॉन्ट", "ഫോണ്ട്"],
  [
    "Text align",
    "टेक्स्ट अलाइनमेंट",
    "టెక్స్ట్ అలైన్‌మెంట్",
    "টেক্সট অ্যালাইনমেন্ট",
    "உரை சீரமைப்பு",
    "मजकूर मांडणी",
    "ടെക്സ്റ്റ് വിന്യാസം",
  ],
  [
    "Opacity",
    "ओपैसिटी",
    "ఒపాసిటీ",
    "অপাসিটি",
    "ஒபாசிட்டி",
    "ऑपॅसिटी",
    "അതാര്യത",
  ],
  ["Layers", "लेयर्स", "లేయర్లు", "লেয়ার", "லேயர்கள்", "लेयर्स", "പാളികൾ"],
] as const;
const codes = ["en", "hi", "te", "bn", "ta", "mr", "ml"] as const;
export const terminology = Object.fromEntries(
  terms.map((row) => [
    row[0],
    Object.fromEntries(codes.map((code, i) => [code, row[i]])),
  ]),
) as Record<string, Record<string, string>>;
const nativeKeys: Record<string, string> = {
  "labels.stroke": "Stroke",
  "labels.fontSize": "Font size",
  "labels.fontFamily": "Font family",
  "labels.textAlign": "Text align",
  "labels.opacity": "Opacity",
  "labels.layers": "Layers",
  "buttons.load": "Open",
  "buttons.export": "Export",
  "buttons.import": "Import",
};
let language = "en";
try {
  language = localStorage.getItem("indidraw-language") ?? "en";
} catch {
  /* Optional preference. */
}
/** Replaces {{name}} placeholders the way the editor's own translator does. */
function fill(text: string, replacement?: Record<string, unknown>) {
  if (!replacement) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in replacement ? String(replacement[key]) : match,
  );
}
/** Read by the editor's translator before its own locale (see vite.config.ts). */
export function editorTerm(
  path: string,
  replacement?: Record<string, unknown>,
): string | undefined {
  if (language === "en") return;
  if (language === "hi" && path === "toolBar.rectangle") return "आयत";
  const own =
    language === "te"
      ? editorLocales[path]?.[0]
      : language === "ml"
        ? editorLocales[path]?.[1]
        : undefined;
  const term = own ?? terminology[nativeKeys[path]]?.[language];
  return term === undefined ? undefined : fill(term, replacement);
}
