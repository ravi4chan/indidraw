import { useEffect, useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { languageOptions, ui, type LanguageCode } from "../../i18n/languages";
import { phoneticLanguages } from "./indic";
import { attachPhoneticInput, type Preview, type TypingMode } from "./input";
import { engineFor } from "./typingMode";

const languageName = (code: string) =>
  languageOptions.find((option) => option.code === code)?.label ?? code;

/** Compact keyboard control that sits beside the language selector. */
export function TypingModeSelect({
  value,
  onChange,
  language,
}: {
  value: TypingMode;
  onChange: (mode: TypingMode) => void;
  language: LanguageCode;
}) {
  return (
    <label
      className="typing-mode"
      title={ui("Keyboard for text on the canvas", language)}
    >
      <Keyboard size={15} aria-hidden="true" />
      <select
        aria-label={ui("Typing mode", language)}
        value={value}
        onChange={(event) => onChange(event.target.value as TypingMode)}
      >
        <option value="english">{ui("English letters", language)}</option>
        <optgroup label={ui("Phonetic: type English letters", language)}>
          {phoneticLanguages.map((code) => (
            <option key={code} value={`${code}-phonetic`}>
              {languageName(code)}
            </option>
          ))}
        </optgroup>
        <optgroup label={ui("Device keyboard: leave text as typed", language)}>
          {phoneticLanguages.map((code) => (
            <option key={code} value={`${code}-native`}>
              {languageName(code)}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

/** Spelling choices float under the text being edited, not in a toolbar. */
export default function PhoneticTyping({
  mode,
  language,
}: {
  mode: TypingMode;
  language: LanguageCode;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(
    null,
  );
  const modeRef = useRef(mode);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const controller = useRef<ReturnType<typeof attachPhoneticInput> | null>(
    null,
  );
  useEffect(() => {
    modeRef.current = mode;
    controller.current?.reset();
  }, [mode]);
  useEffect(() => {
    const show = (value: Preview | null) => {
      setPreview(value);
      const rect = value ? textarea.current?.getBoundingClientRect() : null;
      if (!rect) return setAnchor(null);
      const below = rect.bottom + 8;
      setAnchor({
        left: Math.max(8, Math.min(rect.left, innerWidth - 320)),
        // Flip above the text when there is no room below it.
        top: below + 64 > innerHeight ? Math.max(8, rect.top - 64) : below,
      });
    };
    const sync = () => {
      const next = document.querySelector<HTMLTextAreaElement>(
        '.editor-surface textarea[data-type="wysiwyg"]',
      );
      if (next === textarea.current) return;
      controller.current?.destroy();
      textarea.current = next;
      controller.current = next
        ? attachPhoneticInput(next, () => engineFor(modeRef.current), show)
        : null;
    };
    // Only the drawing surface hosts the text editor; avoid page-wide work.
    const surface = document.querySelector(".editor-surface") ?? document.body;
    const observer = new MutationObserver(sync);
    observer.observe(surface, { childList: true, subtree: true });
    sync();
    return () => {
      observer.disconnect();
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);
  if (!preview || !anchor || !engineFor(mode)) return null;
  return (
    <div
      className="phonetic-candidates"
      role="group"
      aria-label={ui("Spelling choices", language)}
      style={{ left: anchor.left, top: anchor.top }}
    >
      <div className="phonetic-choices">
        <span className="phonetic-raw" lang="en" aria-live="polite">
          {preview.raw}
        </span>
        {preview.candidates.slice(0, 9).map((candidate, index) => (
          <button
            key={candidate}
            type="button"
            aria-label={candidate}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => controller.current?.choose(candidate)}
          >
            <kbd aria-hidden="true">{index + 1}</kbd>
            {candidate}
          </button>
        ))}
      </div>
      <span className="phonetic-help">
        {ui("Space keeps the first choice · press a number to pick", language)}
      </span>
    </div>
  );
}
