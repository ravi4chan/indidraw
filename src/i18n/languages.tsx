import { useEffect, useState } from "react";
import { terminology } from "./editorTerms";
import { siteRows } from "./siteStrings";
import { malayalam } from "./malayalam";
import { moreRows } from "./moreStrings";
export const languageOptions = [
  { code: "en", label: "English", editor: "en" },
  { code: "hi", label: "हिन्दी · Hindi", editor: "hi-IN" },
  { code: "te", label: "తెలుగు · Telugu", editor: "en" },
  { code: "bn", label: "বাংলা · Bengali", editor: "bn-BD" },
  { code: "ta", label: "தமிழ் · Tamil", editor: "ta-IN" },
  { code: "mr", label: "मराठी · Marathi", editor: "mr-IN" },
  { code: "ml", label: "മലയാളം · Malayalam", editor: "en" },
] as const;
export type LanguageCode = (typeof languageOptions)[number]["code"];
const storageKey = "indidraw-language";
export function initialLanguage(): LanguageCode {
  try {
    const value = localStorage.getItem(storageKey);
    return languageOptions.find((l) => l.code === value)?.code ?? "en";
  } catch {
    return "en";
  }
}
export function useLanguage() {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      /* Language selection remains usable without storage. */
    }
  }, [language]);
  return { language, setLanguage };
}
export function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  disabled?: boolean;
}) {
  return (
    <label className="language-selector">
      <span>{ui("Language", value)}</span>
      <select
        aria-label={ui("Language", value)}
        disabled={disabled}
        title={ui(
          "Changing language saves and reopens the board; session undo history restarts.",
          value,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
      >
        {languageOptions.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
// Initial translations; native-speaker review is a release gate. Missing messages
// intentionally fall back to English. Drawing content and titles are never translated.
const rows = [
  ["Language", "भाषा", "భాష", "ভাষা", "மொழி", "भाषा"],
  ["Templates", "टेम्पलेट", "నమూనాలు", "টেমপ্লেট", "வார்ப்புருக்கள்", "साचे"],
  [
    "PNG image",
    "PNG चित्र",
    "PNG చిత్రం",
    "PNG ছবি",
    "PNG படம்",
    "PNG प्रतिमा",
  ],
  [
    "SVG image",
    "SVG चित्र",
    "SVG చిత్రం",
    "SVG ছবি",
    "SVG படம்",
    "SVG प्रतिमा",
  ],
  [
    "Drawing title",
    "चित्र का शीर्षक",
    "చిత్రం పేరు",
    "অঙ্কনের নাম",
    "வரைபடத்தின் பெயர்",
    "चित्राचे शीर्षक",
  ],
  [
    "Saved on this device",
    "इस डिवाइस पर सहेजा गया",
    "ఈ పరికరంలో సేవ్ చేయబడింది",
    "এই ডিভাইসে সংরক্ষিত",
    "இந்தச் சாதனத்தில் சேமிக்கப்பட்டது",
    "या उपकरणावर जतन केले",
  ],
  [
    "Saving…",
    "सहेजा जा रहा है…",
    "సేవ్ అవుతోంది…",
    "সংরক্ষণ হচ্ছে…",
    "சேமிக்கப்படுகிறது…",
    "जतन होत आहे…",
  ],
  [
    "Loading…",
    "लोड हो रहा है…",
    "లోడ్ అవుతోంది…",
    "লোড হচ্ছে…",
    "ஏற்றப்படுகிறது…",
    "लोड होत आहे…",
  ],
  [
    "Not saved",
    "सहेजा नहीं गया",
    "సేవ్ కాలేదు",
    "সংরক্ষিত হয়নি",
    "சேமிக்கப்படவில்லை",
    "जतन झाले नाही",
  ],
  [
    "Ready to draw",
    "चित्र बनाने के लिए तैयार",
    "గీయడానికి సిద్ధంగా ఉంది",
    "আঁকার জন্য প্রস্তুত",
    "வரையத் தயார்",
    "चित्र काढण्यासाठी तयार",
  ],
  [
    "Restore failed",
    "पुनर्स्थापना विफल",
    "పునరుద్ధరణ విఫలమైంది",
    "পুনরুদ্ধার ব্যর্থ",
    "மீட்டெடுக்க முடியவில்லை",
    "पुनर्संचयित करता आले नाही",
  ],
  [
    "Retry save",
    "फिर से सहेजें",
    "మళ్లీ సేవ్ చేయండి",
    "আবার সংরক্ষণ করুন",
    "மீண்டும் சேமி",
    "पुन्हा जतन करा",
  ],
  [
    "Use light theme",
    "लाइट थीम चुनें",
    "లైట్ థీమ్ ఎంచుకోండి",
    "হালকা থিম ব্যবহার করুন",
    "ஒளிர் தோற்றத்தைப் பயன்படுத்து",
    "फिकट थीम वापरा",
  ],
  [
    "Use dark theme",
    "डार्क थीम चुनें",
    "డార్క్ థీమ్ ఎంచుకోండి",
    "গাঢ় থিম ব্যবহার করুন",
    "இருள் தோற்றத்தைப் பயன்படுத்து",
    "गडद थीम वापरा",
  ],
  [
    "Dismiss error",
    "त्रुटि संदेश बंद करें",
    "లోప సందేశాన్ని మూసివేయండి",
    "ত্রুটির বার্তা বন্ধ করুন",
    "பிழைச் செய்தியை மூடு",
    "त्रुटी संदेश बंद करा",
  ],
  [
    "Dismiss notification",
    "सूचना बंद करें",
    "సూచనను మూసివేయండి",
    "বিজ্ঞপ্তি বন্ধ করুন",
    "அறிவிப்பை மூடு",
    "सूचना बंद करा",
  ],
  [
    "New drawing",
    "नया चित्र",
    "కొత్త చిత్రం",
    "নতুন অঙ্কন",
    "புதிய வரைபடம்",
    "नवीन चित्र",
  ],
  [
    "Saved drawings",
    "सहेजे गए चित्र",
    "సేవ్ చేసిన చిత్రాలు",
    "সংরক্ষিত অঙ্কন",
    "சேமித்த வரைபடங்கள்",
    "जतन केलेली चित्रे",
  ],
  [
    "Import native file",
    "मूल फ़ाइल इंपोर्ट करें",
    "స్థానిక ఫైల్‌ను ఇంపోర్ట్ చేయండి",
    "মূল ফাইল ইমপোর্ট করুন",
    "மூலக் கோப்பை இம்போர்ட் செய்",
    "मूळ फाइल इंपोर्ट करा",
  ],
  [
    "Download editable backup",
    "संपादन योग्य बैकअप डाउनलोड करें",
    "సవరించగల బ్యాకప్‌ను డౌన్‌లోడ్ చేయండి",
    "সম্পাদনাযোগ্য ব্যাকআপ ডাউনলোড করুন",
    "திருத்தக்கூடிய காப்புப் பிரதியைப் பதிவிறக்கு",
    "संपादनयोग्य बॅकअप डाउनलोड करा",
  ],
  [
    "Restoring your canvas…",
    "आपका कैनवास पुनर्स्थापित हो रहा है…",
    "మీ కాన్వాస్ పునరుద్ధరించబడుతోంది…",
    "আপনার ক্যানভাস পুনরুদ্ধার হচ্ছে…",
    "உங்கள் வரைதளம் மீட்டெடுக்கப்படுகிறது…",
    "तुमचा कॅनव्हास पुनर्संचयित होत आहे…",
  ],
  [
    "A LITTLE SPACE FOR A BIG IDEA",
    "बड़े विचार के लिए थोड़ी जगह",
    "పెద్ద ఆలోచనకు చిన్న స్థలం",
    "বড় ভাবনার জন্য একটু জায়গা",
    "பெரிய யோசனைக்குச் சிறிது இடம்",
    "मोठ्या कल्पनेसाठी थोडी जागा",
  ],
  [
    "Make yourself at home.",
    "अपनी कल्पना को आकार दें।",
    "మీ ఆలోచనలకు రూపం ఇవ్వండి.",
    "আপনার ভাবনাকে রূপ দিন।",
    "உங்கள் எண்ணங்களுக்கு வடிவம் கொடுங்கள்.",
    "तुमच्या कल्पनांना आकार द्या.",
  ],
  [
    "Pick a tool above, or press R for a rectangle, P for a pen, and T for text. Hold Space to move around.",
    "ऊपर कोई टूल चुनें, या आयत के लिए R, पेन के लिए P और टेक्स्ट के लिए T दबाएँ। कैनवास खिसकाने के लिए Space दबाए रखें।",
    "పైన ఒక సాధనాన్ని ఎంచుకోండి. దీర్ఘచతురస్రానికి R, పెన్నుకు P, వచనానికి T నొక్కండి. కాన్వాస్‌ను కదిలించడానికి Space నొక్కి ఉంచండి.",
    "উপরের একটি টুল বেছে নিন। আয়তক্ষেত্রের জন্য R, কলমের জন্য P ও লেখার জন্য T চাপুন। ক্যানভাস সরাতে Space ধরে রাখুন।",
    "மேலே ஒரு கருவியைத் தேர்ந்தெடுக்கவும். செவ்வகத்திற்கு R, பேனாவிற்கு P, உரைக்கு T அழுத்தவும். வரைதளத்தை நகர்த்த Space அழுத்திப் பிடிக்கவும்.",
    "वरील साधन निवडा. आयतासाठी R, पेनसाठी P आणि मजकुरासाठी T दाबा. कॅनव्हास हलवण्यासाठी Space दाबून ठेवा.",
  ],
  [
    "Your work saves on this device. Export a backup before clearing browser data.",
    "आपका काम इस डिवाइस पर सहेजा जाता है। ब्राउज़र डेटा हटाने से पहले बैकअप एक्सपोर्ट करें।",
    "మీ పని ఈ పరికరంలో సేవ్ అవుతుంది. బ్రౌజర్ డేటాను తొలగించే ముందు బ్యాకప్‌ను ఎక్స్‌పోర్ట్ చేయండి.",
    "আপনার কাজ এই ডিভাইসে সংরক্ষিত হয়। ব্রাউজারের ডেটা মুছে ফেলার আগে ব্যাকআপ এক্সপোর্ট করুন।",
    "உங்கள் வேலை இந்தச் சாதனத்தில் சேமிக்கப்படும். உலாவித் தரவை அழிக்கும் முன் காப்புப் பிரதியை எக்ஸ்போர்ட் செய்யவும்.",
    "तुमचे काम या उपकरणावर जतन होते. ब्राउझर डेटा हटवण्यापूर्वी बॅकअप एक्सपोर्ट करा.",
  ],
  [
    "Let’s draw",
    "चित्र बनाएँ",
    "గీయడం ప్రారంభిద్దాం",
    "আঁকা শুরু করুন",
    "வரையத் தொடங்கலாம்",
    "चित्र काढूया",
  ],
  [
    "Local-first · no account needed",
    "स्थानीय संग्रह · खाते की ज़रूरत नहीं",
    "స్థానిక నిల్వ · ఖాతా అవసరం లేదు",
    "স্থানীয় সংরক্ষণ · অ্যাকাউন্ট লাগে না",
    "உள்ளூர் சேமிப்பு · கணக்கு தேவையில்லை",
    "स्थानिक संचय · खाते आवश्यक नाही",
  ],
  [
    "Offline · drawing stays on this device",
    "ऑफ़लाइन · चित्र इसी डिवाइस पर रहता है",
    "ఆఫ్‌లైన్ · చిత్రం ఈ పరికరంలోనే ఉంటుంది",
    "অফলাইন · অঙ্কন এই ডিভাইসেই থাকে",
    "இணையமில்லா நிலை · வரைபடம் இச்சாதனத்தில் இருக்கும்",
    "ऑफलाइन · चित्र या उपकरणावरच राहते",
  ],
  [
    "Offline ready",
    "ऑफ़लाइन के लिए तैयार",
    "ఆఫ్‌లైన్‌కు సిద్ధం",
    "অফলাইনের জন্য প্রস্তুত",
    "இணையமின்றிப் பயன்படுத்தத் தயார்",
    "ऑफलाइन वापरासाठी तयार",
  ],
  [
    "Preparing offline cache…",
    "ऑफ़लाइन कैश तैयार हो रहा है…",
    "ఆఫ్‌లైన్ కాష్ సిద్ధమవుతోంది…",
    "অফলাইন ক্যাশ প্রস্তুত হচ্ছে…",
    "இணையமில்லா சேமிப்பு தயாராகிறது…",
    "ऑफलाइन कॅशे तयार होत आहे…",
  ],
  [
    "Protect local storage",
    "स्थानीय संग्रह सुरक्षित करें",
    "స్థానిక నిల్వను రక్షించండి",
    "স্থানীয় সংরক্ষণ সুরক্ষিত করুন",
    "உள்ளூர் சேமிப்பைப் பாதுகாக்கவும்",
    "स्थानिक संचय सुरक्षित करा",
  ],
  [
    "Clearing browser data deletes local drawings. Export a backup.",
    "ब्राउज़र डेटा हटाने से स्थानीय चित्र मिट जाएँगे। बैकअप एक्सपोर्ट करें।",
    "బ్రౌజర్ డేటాను తొలగిస్తే స్థానిక చిత్రాలు తొలగిపోతాయి. బ్యాకప్‌ను ఎక్స్‌పోర్ట్ చేయండి.",
    "ব্রাউজারের ডেটা মুছলে স্থানীয় অঙ্কন মুছে যাবে। ব্যাকআপ এক্সপোর্ট করুন।",
    "உலாவித் தரவை அழித்தால் உள்ளூர் வரைபடங்கள் அழியும். காப்புப் பிரதியை எக்ஸ்போர்ட் செய்யவும்.",
    "ब्राउझर डेटा हटवल्यास स्थानिक चित्रे मिटतील. बॅकअप एक्सपोर्ट करा.",
  ],
  [
    "A head start for your idea.",
    "आपके विचार की शुरुआत।",
    "మీ ఆలోచనకు తొలి అడుగు.",
    "আপনার ভাবনার সূচনা।",
    "உங்கள் யோசனைக்கு ஒரு தொடக்கம்.",
    "तुमच्या कल्पनेची सुरुवात.",
  ],
  [
    "Your local drawings",
    "आपके स्थानीय चित्र",
    "మీ స్థానిక చిత్రాలు",
    "আপনার স্থানীয় অঙ্কন",
    "உங்கள் உள்ளூர் வரைபடங்கள்",
    "तुमची स्थानिक चित्रे",
  ],
  [
    "Close dialog",
    "संवाद बंद करें",
    "డైలాగ్‌ను మూసివేయండి",
    "ডায়ালগ বন্ধ করুন",
    "உரையாடலை மூடு",
    "संवाद बंद करा",
  ],
  [
    "No drawings saved yet.",
    "अभी कोई चित्र सहेजा नहीं गया है।",
    "ఇంకా చిత్రాలు సేవ్ చేయబడలేదు.",
    "এখনও কোনো অঙ্কন সংরক্ষিত নেই।",
    "இன்னும் வரைபடங்கள் சேமிக்கப்படவில்லை.",
    "अद्याप कोणतेही चित्र जतन केलेले नाही.",
  ],
  [
    "Saved only in this browser. Export native files for backup.",
    "केवल इस ब्राउज़र में सहेजा गया। बैकअप के लिए मूल फ़ाइलें एक्सपोर्ट करें।",
    "ఈ బ్రౌజర్‌లో మాత్రమే సేవ్ అవుతుంది. బ్యాకప్ కోసం స్థానిక ఫైళ్లను ఎక్స్‌పోర్ట్ చేయండి.",
    "শুধু এই ব্রাউজারে সংরক্ষিত। ব্যাকআপের জন্য মূল ফাইল এক্সপোর্ট করুন।",
    "இந்த உலாவியில் மட்டுமே சேமிக்கப்பட்டது. காப்புப் பிரதிக்கு மூலக் கோப்புகளை எக்ஸ்போர்ட் செய்யவும்.",
    "फक्त या ब्राउझरमध्ये जतन होते. बॅकअपसाठी मूळ फाइल एक्सपोर्ट करा.",
  ],
] as const;
// Older rows have six columns; their Malayalam lives in malayalam.ts. Newer
// rows list all seven languages in languageOptions order.
export const translations = Object.fromEntries([
  ...[...rows, ...siteRows].map((row) => [
    row[0],
    {
      ...Object.fromEntries(
        row.map((text, index) => [languageOptions[index].code, text]),
      ),
      ml: malayalam[row[0]],
    },
  ]),
  ...moreRows.map((row) => [
    row[0],
    Object.fromEntries(languageOptions.map((l, index) => [l.code, row[index]])),
  ]),
]) as Record<string, Record<LanguageCode, string>>;
/** ui() for a message with {placeholders}; values are inserted untranslated. */
export function uiFill(
  english: string,
  params: Record<string, string>,
  language: LanguageCode,
): string {
  return ui(english, language).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? params[key] : match,
  );
}
export function ui(english: string, language: LanguageCode): string {
  if (english === "Export ↓") return `${terminology.Export[language]} ↓`;
  return (
    terminology[english]?.[language] ??
    translations[english]?.[language] ??
    english
  );
}
