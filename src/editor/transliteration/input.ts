import type { Transliterator } from "./hindi";
import type { PhoneticLanguage } from "./indic";

/**
 * "english" leaves letters alone; "<lang>-phonetic" turns English letters
 * into that script as you type; "<lang>-native" is for a device keyboard
 * that already types the script (IndiDraw then never rewrites input).
 */
export type TypingMode =
  "english" | `${PhoneticLanguage}-phonetic` | `${PhoneticLanguage}-native`;
export interface PendingWord {
  raw: string;
  start: number;
  end: number;
}
export interface Preview {
  raw: string;
  candidates: string[];
}
interface Snapshot {
  value: string;
  start: number;
  end: number;
  direction: "forward" | "backward" | "none";
  word: PendingWord | null;
}
interface Edit {
  before: Snapshot;
  after: Snapshot;
}

// This adapter owns only the active Excalidraw textarea. It never scans a
// document for Latin words, and never rewrites pasted/composed/native input.
export function attachPhoneticInput(
  textarea: HTMLTextAreaElement,
  /** The active phonetic engine, or null when typing is left alone. */
  getEngine: () => Transliterator | null,
  preview: (value: Preview | null) => void,
) {
  let word: PendingWord | null = null;
  let composing = false;
  let writing = false;
  // Keep untouched English/native sessions on the browser's own undo stack.
  // Once a phonetic replacement occurs, one history covers mixed input too.
  let managedHistory = false;
  let before: Snapshot | null = null;
  let compositionBefore: Snapshot | null = null;
  const undo: Edit[] = [];
  const redo: Edit[] = [];
  const snapshot = (): Snapshot => ({
    value: textarea.value,
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    direction: textarea.selectionDirection,
    word: word && { ...word },
  });
  const publish = () =>
    preview(
      word
        ? {
            raw: word.raw,
            candidates: getEngine()?.candidates(word.raw) ?? [word.raw],
          }
        : null,
    );
  const reset = () => {
    word = null;
    publish();
  };
  const remember = (previous: Snapshot) => {
    if (previous.value === textarea.value) return;
    undo.push({ before: previous, after: snapshot() });
    if (undo.length > 200) undo.shift();
    redo.length = 0;
  };
  const emit = () => {
    writing = true;
    // Excalidraw's existing oninput measures/shapes and persists this Unicode.
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    writing = false;
  };
  const restore = (state: Snapshot) => {
    textarea.value = state.value;
    textarea.setSelectionRange(state.start, state.end, state.direction);
    word = state.word && { ...state.word };
    emit();
    publish();
  };
  const history = (back: boolean) => {
    const edit = (back ? undo : redo).pop();
    if (!edit) return;
    (back ? redo : undo).push(edit);
    restore(back ? edit.before : edit.after);
  };
  const replace = (start: number, end: number, text: string, raw: string) => {
    managedHistory = true;
    const previous = snapshot();
    textarea.setRangeText(text, start, end, "end");
    word = raw ? { raw, start, end: start + text.length } : null;
    emit();
    remember(previous);
    publish();
  };
  const usableWord = () =>
    word &&
    textarea.selectionStart === word.end &&
    textarea.selectionEnd === word.end;
  const onBeforeInput = (event: InputEvent) => {
    if (writing) return;
    if (
      managedHistory &&
      (event.inputType === "historyUndo" || event.inputType === "historyRedo")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      history(event.inputType === "historyUndo");
      return;
    }
    before = snapshot();
    if (composing || event.isComposing) return;
    const engine = getEngine();
    if (!engine) {
      reset();
      return;
    }
    if (
      event.inputType === "insertText" &&
      event.data &&
      /^[a-z]+$/i.test(event.data) &&
      event.cancelable
    ) {
      event.preventDefault();
      const active = usableWord() ? word : null;
      const raw = (active?.raw ?? "") + event.data;
      replace(
        active?.start ?? textarea.selectionStart,
        textarea.selectionEnd,
        engine.candidates(raw)[0],
        raw,
      );
      before = null;
    } else if (
      event.inputType === "deleteContentBackward" &&
      usableWord() &&
      event.cancelable
    ) {
      event.preventDefault();
      const active = word!;
      const raw = active.raw.slice(0, -1);
      replace(
        active.start,
        active.end,
        raw ? engine.candidates(raw)[0] : "",
        raw,
      );
      before = null;
    } else reset();
  };
  const onInput = () => {
    if (writing || composing) return;
    if (before) remember(before);
    before = null;
    reset();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (composing || event.isComposing || event.keyCode === 229) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (
      managedHistory &&
      modifier &&
      !event.altKey &&
      (event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      history(event.key.toLowerCase() === "z" && !event.shiftKey);
      return;
    }
    // Number keys pick a spelling while a phonetic word is pending, like
    // common Indian-language input tools. Space keeps the first choice.
    const engine = getEngine();
    if (
      engine &&
      usableWord() &&
      !modifier &&
      !event.altKey &&
      /^[1-9]$/.test(event.key)
    ) {
      const candidate = engine.candidates(word!.raw)[Number(event.key) - 1];
      if (candidate) {
        event.preventDefault();
        event.stopImmediatePropagation();
        choose(candidate);
        return;
      }
    }
    // Navigation ends the current phonetic word. Editing existing Unicode then
    // uses ordinary browser selection/backspace behavior.
    if (
      modifier ||
      event.altKey ||
      /^(Arrow|Home|End|Page|Escape|Tab|Enter)/.test(event.key)
    )
      reset();
  };
  const selection = () => {
    if (word && !usableWord()) reset();
  };
  const compositionStart = () => {
    reset();
    composing = true;
    compositionBefore = snapshot();
  };
  const compositionEnd = () => {
    composing = false;
    if (compositionBefore) remember(compositionBefore);
    compositionBefore = null;
    before = null;
    reset();
  };
  const choose = (candidate: string) => {
    if (!word) return;
    textarea.focus();
    replace(word.start, word.end, candidate, "");
  };
  const pointer = () => reset();
  textarea.addEventListener("beforeinput", onBeforeInput);
  textarea.addEventListener("input", onInput);
  textarea.addEventListener("keydown", onKeyDown, true);
  textarea.addEventListener("pointerdown", pointer);
  textarea.addEventListener("paste", pointer);
  textarea.addEventListener("cut", pointer);
  textarea.addEventListener("compositionstart", compositionStart);
  textarea.addEventListener("compositionend", compositionEnd);
  document.addEventListener("selectionchange", selection);
  return {
    reset,
    choose,
    destroy() {
      textarea.removeEventListener("beforeinput", onBeforeInput);
      textarea.removeEventListener("input", onInput);
      textarea.removeEventListener("keydown", onKeyDown, true);
      textarea.removeEventListener("pointerdown", pointer);
      textarea.removeEventListener("paste", pointer);
      textarea.removeEventListener("cut", pointer);
      textarea.removeEventListener("compositionstart", compositionStart);
      textarea.removeEventListener("compositionend", compositionEnd);
      document.removeEventListener("selectionchange", selection);
      preview(null);
    },
  };
}
