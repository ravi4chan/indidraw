// Font for generated labels (templates, assistant). Latin text uses the
// editor's hand-drawn default; Indian scripts use the bundled language fonts
// registered in languageFonts.ts (IDs 201–205) so shapes match typed text.
const EXCALIFONT = 5;
const scripts: [RegExp, number][] = [
  [/[ঀ-৿]/, 203], // Bengali
  [/[஀-௿]/, 204], // Tamil
  [/[ఀ-౿]/, 202], // Telugu
];
export function labelFont(text: string, language?: string): number {
  if (/[ऀ-ॿ]/.test(text)) return language === "mr" ? 205 : 201;
  return scripts.find(([range]) => range.test(text))?.[1] ?? EXCALIFONT;
}
