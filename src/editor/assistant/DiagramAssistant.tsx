import { useEffect, useState } from "react";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { ArrowRight, Check, MicOff, Sparkles, Undo2, X } from "lucide-react";
import { ui, type LanguageCode } from "../../i18n/languages";
import { planCommands, type Batch, type Operation } from "./commands";
import {
  applyBatch,
  assistantNodes,
  revertBatch,
  sceneRevision,
} from "./scene";

const examples = [
  ["Rainwater harvesting", "Roof → Filter → Storage tank → Garden"],
  [
    "A review workflow",
    'ellipse "Start"\nbox "Review"\ndiamond "Approved?"\nconnect "Start" → "Review"\nconnect "Review" → "Approved?"',
  ],
  ["हिंदी में एक प्रवाह", "वर्षा → छत → फ़िल्टर → पानी की टंकी"],
] as const;
const syntax = [
  "Roof → Filter → Tank",
  'box "Student"',
  'ellipse "Start"',
  'diamond "Approved?"',
  'connect "Start" → "Student"',
  'rename "Student" to "Learner"',
];

export default function DiagramAssistant({
  api,
  language,
  onPreview,
  onClose,
  onApplied,
}: {
  api: ExcalidrawImperativeAPI;
  language: LanguageCode;
  onPreview: (elements: readonly ExcalidrawElement[] | null) => void;
  onClose: () => void;
  onApplied: () => void;
}) {
  const tr = (text: string) => ui(text, language);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<{
    batch: Batch;
    revision: string;
    labels: Map<string, string>;
    original: Map<string, string>;
  } | null>(null);
  const [applied, setApplied] = useState<{
    before: readonly ExcalidrawElement[];
    revision: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => () => onPreview(null), [onPreview]);
  function clearPreview() {
    setPreview(null);
    onPreview(null);
  }
  function prepare() {
    setError("");
    setStatus("");
    setApplied(null);
    clearPreview();
    try {
      const elements = api.getSceneElementsIncludingDeleted();
      const nodes = assistantNodes(elements);
      const batch = planCommands(input, nodes);
      // Full dry run: no partial application on error.
      const result = applyBatch(elements, batch);
      const previous = new Map(elements.map((e) => [e.id, e]));
      const ghost = result.filter(
        (e) =>
          !e.isDeleted &&
          previous.get(e.id) !== e &&
          // Existing shapes only change their bound arrows; outline new
          // shapes, arrows and renamed labels.
          (!previous.has(e.id) || e.type === "text"),
      );
      const original = new Map(nodes.map((n) => [n.id, n.label]));
      const labels = new Map(original);
      for (const op of batch.operations)
        if (op.type !== "connect_nodes") labels.set(op.id, op.label);
      setPreview({
        batch,
        revision: sceneRevision(elements),
        labels,
        original,
      });
      onPreview(ghost);
      if (ghost.length)
        api.scrollToContent(ghost as ExcalidrawElement[], {
          fitToViewport: true,
          viewportZoomFactor: 0.7,
          animate: true,
        });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : tr("Could not preview this command."),
      );
    }
  }
  function commit() {
    if (!preview) return;
    try {
      const elements = api.getSceneElementsIncludingDeleted();
      if (sceneRevision(elements) !== preview.revision)
        throw new Error(
          "Your canvas changed after this preview. Preview again to use the latest drawing.",
        );
      const next = applyBatch(elements, preview.batch);
      api.updateScene({
        elements: next,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      clearPreview();
      setApplied({
        before: elements,
        revision: sceneRevision(api.getSceneElementsIncludingDeleted()),
      });
      setInput("");
      setError("");
      setStatus("Added to your drawing.");
      onApplied();
    } catch (e) {
      clearPreview();
      setError(
        e instanceof Error ? e.message : tr("Could not apply this command."),
      );
    }
  }
  function undo() {
    if (!applied) return;
    const current = api.getSceneElementsIncludingDeleted();
    setApplied(null);
    if (sceneRevision(current) !== applied.revision) {
      setStatus(
        "The canvas changed after this was added. Use the canvas Undo button instead.",
      );
      return;
    }
    api.updateScene({
      elements: revertBatch(applied.before, current),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    setStatus("Removed from your drawing.");
  }
  const chooseExample = (value: string) => {
    setInput(value);
    clearPreview();
    setError("");
    setStatus("");
  };
  const describe = (
    op: Operation,
    labels: Map<string, string>,
    original: Map<string, string>,
  ) => {
    if (op.type === "add_node")
      return `${tr(op.shape === "rectangle" ? "Box" : op.shape === "ellipse" ? "Ellipse" : "Diamond")}: ${op.label}`;
    if (op.type === "rename_node")
      return `${tr("Rename")}: ${original.get(op.id) ?? "?"} → ${op.label}`;
    return `${tr("Arrow")}: ${labels.get(op.from) ?? "?"} → ${labels.get(op.to) ?? "?"}`;
  };
  return (
    <aside
      className="diagram-assistant"
      aria-label="Diagram assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="assistant-heading">
        <div>
          <span className="eyebrow">INDIDRAW LABS</span>
          <h2>
            <Sparkles size={18} /> {tr("Diagram assistant")}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={tr("Close diagram assistant")}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          prepare();
        }}
      >
        <label htmlFor="diagram-instruction">{tr("Build a diagram")}</label>
        <p className="assistant-hint" id="diagram-help">
          {tr(
            "Write a flow with arrows, or one command per line. Labels can be in any language.",
          )}
        </p>
        <ul
          className="assistant-syntax"
          aria-label={tr("Commands you can use")}
        >
          {syntax.map((line) => (
            <li key={line}>
              <button
                type="button"
                title={tr("Add this line")}
                onClick={() =>
                  chooseExample(
                    input.trim() ? `${input.trimEnd()}\n${line}` : line,
                  )
                }
              >
                <code>{line}</code>
              </button>
            </li>
          ))}
        </ul>
        <textarea
          id="diagram-instruction"
          aria-describedby="diagram-help"
          rows={5}
          maxLength={4000}
          placeholder="Roof → Filter → Storage tank → Garden"
          value={input}
          onChange={(e) => chooseExample(e.target.value)}
        />
        <button
          className="button primary"
          type="submit"
          disabled={!input.trim()}
        >
          {tr("Preview changes")} <ArrowRight size={15} />
        </button>
      </form>
      {error && (
        <p className="assistant-error" role="alert">
          {tr(error)}
        </p>
      )}
      {preview && (
        <section
          className="assistant-preview"
          aria-label={tr("Proposed changes")}
        >
          <h3>{tr("Ready to add")}</h3>
          <p className="assistant-hint">
            {tr("The dashed outline on the canvas shows where it will go.")}
          </p>
          <ol>
            {preview.batch.operations.map((op, index) => (
              <li key={index}>
                {describe(op, preview.labels, preview.original)}
              </li>
            ))}
          </ol>
          <div className="assistant-preview-actions">
            <button type="button" className="button primary" onClick={commit}>
              {tr("Apply to canvas")} <Check size={15} />
            </button>
            <button
              type="button"
              className="editor-control"
              onClick={clearPreview}
            >
              {tr("Discard")}
            </button>
          </div>
        </section>
      )}
      <div className="assistant-result" role="status">
        {status && <span>{tr(status)}</span>}
        {applied && (
          <button
            type="button"
            className="editor-control"
            aria-label={tr("Undo assistant change")}
            onClick={undo}
          >
            <Undo2 size={14} /> {tr("Undo")}
          </button>
        )}
      </div>
      <div className="assistant-examples">
        <span className="eyebrow">{tr("TRY AN EXAMPLE")}</span>
        {examples.map(([name, value]) => (
          <button key={name} type="button" onClick={() => chooseExample(value)}>
            {tr(name)} <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div className="assistant-voice-status">
        <MicOff size={18} />
        <div>
          <strong>{tr("Voice is not connected yet")}</strong>
          <p>
            {tr(
              "This preview runs on your device and does not use AI. Connect and rename work with shapes created here.",
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
