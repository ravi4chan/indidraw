// Researched terminology plus deliberate transliterations; see docs/LOCALIZATION.md.
const terms = [
  ["New", "नया", "కొత్తది", "নতুন", "புதியது", "नवीन"],
  ["Open", "खोलें", "తెరవండి", "খুলুন", "திற", "उघडा"],
  [
    "Templates",
    "टेम्प्लेट",
    "టెంప్లేట్లు",
    "টেমপ্লেট",
    "டெம்ப்ளேட்கள்",
    "टेम्प्लेट",
  ],
  ["Import", "इंपोर्ट", "ఇంపోర్ట్", "ইমপোর্ট", "இம்போர்ட்", "इम्पोर्ट"],
  [
    "Export",
    "एक्सपोर्ट",
    "ఎక్స్‌పోర్ట్",
    "এক্সপোর্ট",
    "எக்ஸ்போர்ட்",
    "एक्सपोर्ट",
  ],
  ["Stroke", "स्ट्रोक", "స్ట్రోక్", "স্ট্রোক", "ஸ்ட்ரோக்", "स्ट्रोक"],
  [
    "Font size",
    "फ़ॉन्ट साइज़",
    "ఫాంట్ సైజు",
    "ফন্টের আকার",
    "எழுத்துரு அளவு",
    "फॉन्ट आकार",
  ],
  ["Font family", "फ़ॉन्ट", "ఫాంట్", "ফন্ট", "எழுத்துரு", "फॉन्ट"],
  [
    "Text align",
    "टेक्स्ट अलाइनमेंट",
    "టెక్స్ట్ అలైన్‌మెంట్",
    "টেক্সট অ্যালাইনমেন্ট",
    "உரை சீரமைப்பு",
    "मजकूर मांडणी",
  ],
  ["Opacity", "ओपैसिटी", "ఒపాసిటీ", "অপাসিটি", "ஒபாசிட்டி", "ऑपॅसिटी"],
  ["Layers", "लेयर्स", "లేయర్లు", "লেয়ার", "லேயர்கள்", "लेयर्स"],
] as const;
const codes = ["en", "hi", "te", "bn", "ta", "mr"] as const;
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
export function editorTerm(path: string): string | undefined {
  if (language === "en") return;
  if (language === "hi" && path === "toolBar.rectangle") return "आयत";
  return terminology[nativeKeys[path]]?.[language];
}
