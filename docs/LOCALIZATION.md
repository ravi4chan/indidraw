# Indian languages: translations, fonts and typography

IndiDraw's interface is available in English, Hindi, Telugu, Bengali, Tamil and Marathi. This document records how text is translated, which fonts are used and how Indian scripts are typeset.

## Editor terminology

Reviewed 23 October 2026. English remains the default. Short, familiar translations are preferred; technical terms use transliteration where a literal translation obscures the control. Drawing content is never translated.

| English     | Hindi             | Telugu               | Bengali              | Tamil          | Marathi      |
| ----------- | ----------------- | -------------------- | -------------------- | -------------- | ------------ |
| New         | नया               | కొత్తది              | নতুন                 | புதியது        | नवीन         |
| Open        | खोलें             | తెరవండి              | খুলুন                | திற            | उघडा         |
| Templates   | टेम्प्लेट         | టెంప్లేట్లు          | টেমপ্লেট             | டெம்ப்ளேட்கள்  | टेम्प्लेट    |
| Import      | इंपोर्ट           | ఇంపోర్ట్             | ইমপোর্ট              | இம்போர்ட்      | इम्पोर्ट     |
| Export      | एक्सपोर्ट         | ఎక్స్‌పోర్ట్         | এক্সপোর্ট            | எக்ஸ்போர்ட்    | एक्सपोर्ट    |
| Stroke      | स्ट्रोक           | స్ట్రోక్             | স্ট্রোক              | ஸ்ட்ரோக்       | स्ट्रोक      |
| Font size   | फ़ॉन्ट साइज़      | ఫాంట్ సైజు           | ফন্টের আকার          | எழுத்துரு அளவு | फॉन्ट आकार   |
| Font family | फ़ॉन्ट            | ఫాంట్                | ফন্ট                 | எழுத்துரு      | फॉन्ट        |
| Text align  | टेक्स्ट अलाइनमेंट | టెక్స్ట్ అలైన్‌మెంట్ | টেক্সট অ্যালাইনমেন্ট | உரை சீரமைப்பு  | मजकूर मांडणी |
| Opacity     | ओपैसिटी           | ఒపాసిటీ              | অপাসিটি              | ஒபாசிட்டி      | ऑपॅसिटी      |
| Layers      | लेयर्स            | లేయర్లు              | লেয়ার               | லேயர்கள்       | लेयर्स       |

## References and editorial decisions

- [Google Contacts Hindi](https://support.google.com/contacts/answer/15147365?hl=hi) uses import/export transliterations. IndiDraw follows that approach rather than trade-related literal terms.
- [Google Docs Hindi](https://support.google.com/docs/answer/1663349?hl=hi), [Marathi](https://support.google.com/docs/answer/1663349?hl=mr), [Telugu screen-reader help](https://support.google.com/docs/answer/1632201?hl=te), and [Tamil](https://support.google.com/docs/answer/1663349?hl=ta) provide software context for font, size and alignment wording.
- [Visme Hindi](https://www.visme.co/hi/pamphlet-banaye/) uses familiar template/font wording in a design product.
- Bengali Google Docs help fell back to English during retrieval; it is not evidence of reviewed Bengali equivalents. Bengali labels and the short Stroke/Opacity/Layers transliterations are editorial choices, not claimed verbatim official translations.
- Font family is displayed as the natural equivalent of “Font”, avoiding literal “family” terminology. Opacity keeps its 0 = transparent / 100 = opaque behavior; the value is never inverted.
- Corrected upstream Hindi Rectangle from “आयात” (import) to “आयत”. Native-speaker usability review remains desirable; this is a source-informed terminology pass, not certification of every upstream string.

## Five selectable fonts

| Language | Face                  | Native ID |
| -------- | --------------------- | --------- |
| Hindi    | Noto Sans Devanagari  | 201       |
| Telugu   | Noto Sans Telugu      | 202       |
| Bengali  | Noto Sans Bengali     | 203       |
| Tamil    | Noto Sans Tamil       | 204       |
| Marathi  | Noto Serif Devanagari | 205       |

All are local SIL OFL 1.1 font files with matching Latin subsets and retained notices. Baseline metrics are read from each bundled font’s head/hhea tables. Marathi uses a distinct serif face. Select them in the native font picker; choosing a UI language does not restyle existing drawings.

Custom IDs are registered before restoring native files. IndiDraw preserves them on reload/import. Other applications may substitute fonts for these custom IDs; PNG/SVG exports are the portable visual formats. SVG embeds complete custom font files, preserving shaping tables and avoiding optional worker/eval subsetting.

The version-pinned Vite adapter exposes Excalidraw’s existing font registry and overrides only the reviewed translation keys. Telugu receives those settings labels while unreviewed advanced native messages still use English. Font/translation adapters must be reviewed when upgrading Excalidraw.

## Website and interface translations

The language menu appears in both the website header and the editor, and both read and write the same `indidraw-language` setting, so a choice on the home page carries into the editor.

- Interface text lives in `src/i18n/languages.tsx` (editor basics) and `src/i18n/siteStrings.ts` (home page, gallery, File menu, assistant, typing). Each row holds English, Hindi, Telugu, Bengali, Tamil and Marathi, in that order.
- `ui(english, language)` looks up a string and falls back to English when a translation is missing.
- The home page and template gallery are translated. About, Privacy, Terms, License and Contributing pages are English and marked `lang="en"`.
- Template names and descriptions are content, not interface text, and are not translated. Three templates are written in Hindi.
- These are initial translations. Native-speaker review is welcome: use the **Translation improvement** issue form.

## Typography for Indian scripts

The website's English design uses tight, negative letter spacing on headings. That spacing breaks Indian scripts, crushing letters and the gaps between words, so other languages are typeset differently:

- **Fonts.** The website uses Noto Sans Devanagari, Telugu, Bengali and Tamil in regular (400) and semibold (600), declared as the `IndiDraw Site` font family with `unicode-range`. A browser only downloads a script's font when a page shows that script. Telugu and Bengali faces use `size-adjust` (110% and 106%) to match the visual size of neighbouring Latin text.
- **Spacing.** For every language except English, letter spacing is normal and word spacing is slightly wider (0.06em for text, 0.1em for headings). Uppercase transforms are removed.
- **Line height.** Headings use 1.4–1.5 and paragraphs 1.9, leaving room for vowel signs above and below the letters.
- **Long words.** Telugu and Tamil headings are slightly smaller, because their words run long.

When adding styles, never apply letter spacing to Indian-script text. The rules live at the end of `src/styles.css`.
