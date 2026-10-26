import { useEffect, useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { ui, type LanguageCode } from "../../i18n/languages";
import { hindiTransliterator } from "./hindi";
import { attachPhoneticInput, type Preview, type TypingMode } from "./input";

export function defaultTypingMode(language: LanguageCode): TypingMode {
  return language === "hi" ? "hi-phonetic" : "english";
}

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
        aria-label="Typing mode"
        value={value}
        onChange={(event) => onChange(event.target.value as TypingMode)}
      >
        <option value="english">{ui("English letters", language)}</option>
        <option value="hi-phonetic">{ui("Hindi phonetic", language)}</option>
        <option value="hi-native">
          {ui("Device Hindi keyboard", language)}
        </option>
      </select>
    </label>
  );
}

/** Spelling choices float under the text being edited, not in a toolbar. */
export default function HindiTyping({
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
        ? attachPhoneticInput(
            next,
            hindiTransliterator,
            () => modeRef.current,
            show,
          )
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
  if (!preview || !anchor || mode !== "hi-phonetic") return null;
  return (
    <div
      className="phonetic-candidates"
      role="group"
      aria-label="Hindi spelling choices"
      style={{ left: anchor.left, top: anchor.top }}
    >
      <div className="phonetic-choices">
        <span className="phonetic-raw" aria-live="polite">
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
