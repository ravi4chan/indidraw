import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "./newId";
import {
  Excalidraw,
  languages as editorLanguages,
  MainMenu,
  restore,
  serializeAsJSON,
  exportToBlob,
  exportToSvg,
  useHandleLibrary,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import {
  AlertTriangle,
  Check,
  Download,
  FilePlus2,
  FolderOpen,
  LoaderCircle,
  Moon,
  Sun,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Brand } from "../App";
import {
  getDrawing,
  listDrawings,
  saveDrawing,
  saveError,
  type Drawing,
} from "../storage/documents";
import { MAX_FILE_BYTES, validateScene } from "./validation";
import { templates } from "../templates/data";
import { useTemplateFilter, TemplateFilters } from "../templates/filters";
import { templateElements } from "./templateScene";
import Diagram from "../Diagram";
import { t } from "../i18n";
import {
  LanguageSelector,
  languageOptions,
  useLanguage,
  ui,
  type LanguageCode,
} from "../i18n/languages";
// These locale bundles ship upstream but are omitted by its completeness filter.
for (const locale of languageOptions)
  if (
    locale.editor !== "en" &&
    !editorLanguages.some((l) => l.code === locale.editor)
  )
    editorLanguages.push({ code: locale.editor, label: locale.label });
import { rasterFiles } from "./rasterFiles";
import { loadIndicFonts, embedIndicFonts } from "./indicFonts";
import { libraryAdapter } from "../storage/library";
import "./languageFonts";
import HindiTyping, {
  TypingModeSelect,
  defaultTypingMode,
} from "./transliteration/HindiTyping";
import type { TypingMode } from "./transliteration/input";
import DiagramAssistant from "./assistant/DiagramAssistant";
import AssistantGhost from "./assistant/AssistantGhost";
import FileMenu, { type ExportFormat } from "./FileMenu";
type Notice = { text: string; action?: { label: string; run: () => void } };
// Remind people to keep a file copy after this much continuous drawing.
const BACKUP_NUDGE_MS = 30 * 60 * 1000;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function Editor() {
  const { language } = useLanguage();
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantToggle = useRef<HTMLButtonElement>(null);
  const [ghost, setGhost] = useState<readonly ExcalidrawElement[] | null>(null);
  // One language choice drives menus and the default keyboard for canvas text.
  const [typingMode, setTypingMode] = useState<TypingMode>(() =>
    defaultTypingMode(language),
  );
  const editorLanguage = languageOptions.find(
    (l) => l.code === language,
  )!.editor;
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  useHandleLibrary({ excalidrawAPI: api, adapter: libraryAdapter });
  const [initial, setInitial] = useState<ExcalidrawInitialDataState | null>(
    null,
  );
  const [title, setTitle] = useState(t("title"));
  const titleRef = useRef(title);
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = useCallback(
    (text: string, action?: Notice["action"]) => setNotice({ text, action }),
    [],
  );
  const [namePrompt, setNamePrompt] = useState<ExportFormat | null>(null);
  const [draftName, setDraftName] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const nameNudged = useRef(false);
  const nameAsked = useRef(false);
  const editingSince = useRef<number | null>(null);
  const backupNudged = useRef(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("indidraw-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [modal, setModal] = useState<"templates" | "documents" | "name" | null>(
    null,
  );
  const templateFilter = useTemplateFilter();
  const [documents, setDocuments] = useState<Drawing[]>([]);
  const [onboard, setOnboard] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(
    import.meta.env.DEV
      ? "Offline cache available in production build"
      : "Preparing offline cache…",
  );
  const [online, setOnline] = useState(navigator.onLine);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useRef("");
  const revision = useRef(0);
  const persistedRevision = useRef<number | null>(null);
  const ready = useRef(false);
  const blocked = useRef(false);
  const pending = useRef<{
    scene: string;
    title: string;
    revision: number;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const signature = useRef("");
  const saving = useRef(false);
  const failed = useRef(false);
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (saving.current) {
      await new Promise((r) => setTimeout(r, 40));
      return flush();
    }
    const item = pending.current;
    if (!item) return !failed.current;
    saving.current = true;
    try {
      await saveDrawing(
        { id: id.current, updatedAt: Date.now(), ...item },
        persistedRevision.current,
      );
      persistedRevision.current = item.revision;
      if (pending.current === item) pending.current = null;
      failed.current = false;
      setError("");
      setStatus(pending.current ? "Saving…" : t("saved"));
    } catch (e) {
      failed.current = true;
      setStatus("Not saved");
      setError(saveError(e));
      return false;
    } finally {
      saving.current = false;
    }
    return pending.current ? flush() : true;
  }, []);
  const queue = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      if (!ready.current || blocked.current) return;
      const scene = serializeAsJSON(
        elements,
        { viewBackgroundColor: appState.viewBackgroundColor },
        files,
        "local",
      );
      const sig = scene + "|" + titleRef.current;
      if (sig === signature.current) return;
      signature.current = sig;
      revision.current = Math.max(Date.now(), revision.current + 1);
      pending.current = {
        scene,
        title: titleRef.current,
        revision: revision.current,
      };
      setStatus(t("saving"));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 650);
      if (!elements.some((e) => !e.isDeleted)) return;
      setOnboard(false);
      const now = Date.now();
      editingSince.current ??= now;
      if (
        !backupNudged.current &&
        now - editingSince.current > BACKUP_NUDGE_MS
      ) {
        backupNudged.current = true;
        notify(
          "You’ve been drawing for a while. Download a backup to keep it safe.",
          {
            label: "Download backup",
            run: () => void exportRef.current("excalidraw", true),
          },
        );
      } else if (!nameNudged.current && titleRef.current === t("title")) {
        nameNudged.current = true;
        notify("Give this drawing a name so it’s easy to find later.", {
          label: "Name it",
          run: () => {
            titleInput.current?.focus();
            titleInput.current?.select();
          },
        });
      }
    },
    [flush, notify],
  );
  const exportRef = useRef<
    (format: ExportFormat, skipName?: boolean) => Promise<void>
  >(async () => {});
  useEffect(() => {
    let active = true;
    async function load() {
      await loadIndicFonts().catch(() => {
        if (active)
          notify(
            "The bundled Indian-language fonts could not load. Reconnect once before exporting complex-script text.",
          );
      });
      const params = new URLSearchParams(location.search);
      const template = templates.find((t) => t.id === params.get("template"));
      let target = params.get("id");
      if (!target && !template)
        try {
          target = localStorage.getItem("indidraw-last-document");
        } catch {
          /* A fresh document is still available. */
        }
      id.current = target ?? newId();
      try {
        const saved = target ? await getDrawing(target) : undefined;
        if (!active) return;
        if (saved) {
          const scene = validateScene(saved.scene, "local");
          const restored = restore(
            scene as unknown as Parameters<typeof restore>[0],
            null,
            null,
          );
          signature.current =
            serializeAsJSON(
              restored.elements,
              { viewBackgroundColor: restored.appState.viewBackgroundColor },
              restored.files ?? {},
              "local",
            ) +
            "|" +
            saved.title;
          setInitial({ ...restored, scrollToContent: true });
          setTitle(saved.title);
          titleRef.current = saved.title;
          revision.current = saved.revision;
          persistedRevision.current = saved.revision;
          setStatus(t("saved"));
        } else {
          if (target)
            notify(
              "The requested drawing was not found. A new canvas has been opened.",
            );
          id.current = newId();
          setInitial({
            elements: template ? templateElements(template) : [],
            appState: { viewBackgroundColor: "#ffffff" },
            scrollToContent: true,
          });
          const name = template?.name ?? t("title");
          setTitle(name);
          titleRef.current = name;
          setStatus("Ready to draw");
          setOnboard(!template);
        }
        ready.current = true;
        try {
          localStorage.setItem("indidraw-last-document", id.current);
        } catch {
          /* IndexedDB may remain available. */
        }
        history.replaceState(
          null,
          "",
          `/draw?id=${encodeURIComponent(id.current)}`,
        );
      } catch (e) {
        if (!active) return;
        blocked.current = true;
        setError(
          `Could not restore this drawing: ${saveError(e)}. The stored record has not been overwritten. Open another saved drawing or start a new one.`,
        );
        setStatus("Restore failed");
        setInitial({ elements: [] });
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (api && ready.current)
      queue(
        api.getSceneElementsIncludingDeleted(),
        api.getAppState(),
        api.getFiles(),
      );
  }, [api, initial, queue]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("indidraw-theme", dark ? "dark" : "light");
    } catch {
      /* Optional preference. */
    }
  }, [dark]);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const before = (e: BeforeUnloadEvent) => {
      if (pending.current || failed.current) {
        void flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const network = () => setOnline(navigator.onLine);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", before);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    const cacheCheck = () => {
      void caches
        .keys()
        .then((keys) =>
          setCacheStatus(
            keys.some((k) => k.startsWith("indidraw-"))
              ? "Offline ready"
              : "Offline cache not ready — reconnect to retry",
          ),
        )
        .catch(() => setCacheStatus("Offline cache unavailable"));
    };
    const cacheFailure = () =>
      setCacheStatus(
        "Offline cache unavailable — reconnect and reload to retry",
      );
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(cacheCheck);
      navigator.serviceWorker.addEventListener("controllerchange", cacheCheck);
    }
    window.addEventListener("indidraw-cache-error", cacheFailure);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("indidraw-cache-error", cacheFailure);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        cacheCheck,
      );
    };
  }, [flush]);
  async function changeLanguage(next: LanguageCode) {
    if (next === language || changingLanguage) return;
    setChangingLanguage(true);
    if (!(await flush())) {
      setChangingLanguage(false);
      return;
    }
    try {
      localStorage.setItem("indidraw-language", next);
    } catch {
      setError(
        "The browser could not remember this language preference. Your drawing is unchanged.",
      );
      setChangingLanguage(false);
      return;
    }
    // A clean mount avoids competing asynchronous upstream locale requests.
    // Persist before navigation; do not remount the editor with stale initialData.
    location.reload();
  }
  async function openDocuments() {
    if (!(await flush())) return;
    try {
      setDocuments(await listDrawings());
      setModal("documents");
    } catch (e) {
      setError(saveError(e));
    }
  }
  async function newDrawing(templateId?: string) {
    if (!(await flush())) return;
    const next = newId();
    location.href = templateId
      ? `/draw?template=${templateId}`
      : `/draw?id=${next}`;
  }
  async function importFile(file: File) {
    try {
      if (!file.name.toLowerCase().endsWith(".excalidraw"))
        throw new Error("Choose a native .excalidraw file.");
      if (file.size > MAX_FILE_BYTES)
        throw new Error("Choose a file smaller than 20 MB.");
      const scene = validateScene(await file.text());
      const restored = restore(
        scene as unknown as Parameters<typeof restore>[0],
        null,
        null,
      );
      if (!(await flush())) return;
      const importedId = newId();
      const name =
        file.name.replace(/\.excalidraw$/i, "").slice(0, 120) || t("title");
      await saveDrawing({
        id: importedId,
        title: name,
        scene: serializeAsJSON(
          restored.elements,
          restored.appState,
          restored.files ?? {},
          "local",
        ),
        revision: Date.now(),
        updatedAt: Date.now(),
      });
      location.href = `/draw?id=${importedId}`;
    } catch (e) {
      setError(saveError(e));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  function rename(next: string) {
    setTitle(next);
    titleRef.current = next;
    if (api)
      queue(
        api.getSceneElementsIncludingDeleted(),
        api.getAppState(),
        api.getFiles(),
      );
  }
  async function exportDrawing(format: ExportFormat, skipName = false) {
    if (!api) return;
    // Ask once for a name so downloads and the saved list aren't all "Untitled".
    if (!skipName && !nameAsked.current && titleRef.current === t("title")) {
      nameAsked.current = true;
      setDraftName("");
      setNamePrompt(format);
      setModal("name");
      return;
    }
    try {
      const elements = api.getSceneElements();
      const appState = { ...api.getAppState(), exportEmbedScene: true };
      const files = api.getFiles();
      const name =
        titleRef.current.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "IndiDraw";
      if (format === "excalidraw")
        download(
          new Blob(
            [
              serializeAsJSON(
                elements,
                appState,
                await rasterFiles(files),
                "local",
              ),
            ],
            { type: "application/json" },
          ),
          `${name}.excalidraw`,
        );
      else {
        if (!elements.length)
          throw new Error(
            "Add something to your canvas before exporting an image.",
          );
        if (format === "png")
          download(
            await exportToBlob({
              elements,
              appState,
              files,
              maxWidthOrHeight: 4096,
            }),
            `${name}.png`,
          );
        else if (format === "svg") {
          const svg = await exportToSvg({ elements, appState, files });
          if (
            elements.some(
              (el) => el.type === "text" && /[\u0900-\u0c7f]/.test(el.text),
            )
          )
            await embedIndicFonts(svg);
          download(
            new Blob([svg.outerHTML], { type: "image/svg+xml" }),
            `${name}.svg`,
          );
        }
      }
      if (format === "excalidraw") {
        editingSince.current = null;
        backupNudged.current = false;
      }
      notify(
        format === "excalidraw"
          ? "Backup saved to your downloads."
          : `${format.toUpperCase()} image saved to your downloads.`,
      );
    } catch (e) {
      setError(saveError(e));
    }
  }
  exportRef.current = exportDrawing;
  useEffect(() => {
    // Errors stay until dismissed; ordinary notices fade on their own.
    if (!notice) return;
    const timeout = setTimeout(
      () => setNotice(null),
      notice.action ? 12000 : 5000,
    );
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (!modal) return;
    const dialog = document.querySelector<HTMLDialogElement>(".modal");
    const previous = document.activeElement as HTMLElement | null;
    (dialog?.querySelector<HTMLElement>("[data-autofocus]") ?? dialog)?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab" && dialog) {
        const items = [
          ...dialog.querySelectorAll<HTMLElement>(
            "button,a[href],input,select",
          ),
        ];
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [modal]);
  const saveState =
    status === t("saved")
      ? "saved"
      : status === "Not saved" || status === "Restore failed"
        ? "failed"
        : status === t("saving")
          ? "saving"
          : "idle";
  return (
    <div className="editor-layout" lang={language}>
      <header className="editor-header">
        <span
          className="editor-brand"
          onClick={(e) => {
            if (pending.current || failed.current) {
              e.preventDefault();
              void flush().then((ok) => {
                if (ok) location.href = "/";
              });
            }
          }}
        >
          <Brand />
        </span>
        <div className="title-group">
          <input
            ref={titleInput}
            className="document-name"
            disabled={!initial || blocked.current}
            aria-label={ui("Drawing title", language)}
            title={title}
            style={{
              width: `${Math.min(40, Math.max(16, Array.from(title).length + 3))}ch`,
            }}
            value={title}
            maxLength={120}
            onChange={(e) => rename(e.target.value)}
          />
          <span
            className={`save-status ${saveState}`}
            role="status"
            title={ui(status, language)}
          >
            {saveState === "saved" ? (
              <Check size={14} aria-hidden="true" />
            ) : saveState === "failed" ? (
              <AlertTriangle size={14} aria-hidden="true" />
            ) : saveState === "saving" ? (
              <LoaderCircle size={14} aria-hidden="true" className="spin" />
            ) : null}
            <span className="save-text">{ui(status, language)}</span>
          </span>
        </div>
        <div className="editor-actions">
          <button
            className="editor-control assistant-toggle"
            ref={assistantToggle}
            disabled={!api || !initial || blocked.current}
            aria-expanded={assistantOpen}
            aria-controls="diagram-assistant-panel"
            aria-label={ui("Diagram assistant", language)}
            onClick={() => setAssistantOpen(!assistantOpen)}
          >
            <Sparkles />
            <span className="control-label">
              {ui("Diagram assistant", language)}
            </span>
          </button>
          <div className="language-pair">
            <LanguageSelector
              value={language}
              onChange={(next) => void changeLanguage(next)}
              disabled={!initial || changingLanguage}
            />
            <TypingModeSelect
              value={typingMode}
              onChange={setTypingMode}
              language={language}
            />
          </div>
          <FileMenu
            language={language}
            disabled={!initial}
            exportDisabled={!api}
            onNew={() => void newDrawing()}
            onOpen={() => void openDocuments()}
            onTemplates={() => setModal("templates")}
            onImport={() => fileInput.current?.click()}
            onExport={(format) => void exportDrawing(format)}
          />
          <button
            className="icon-button"
            aria-label={ui(
              dark ? "Use light theme" : "Use dark theme",
              language,
            )}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept=".excalidraw"
          onChange={(e) => {
            if (e.target.files?.[0]) void importFile(e.target.files[0]);
          }}
        />
      </header>
      {/* Pop-up notices float over the canvas instead of pushing it down. */}
      <div className="toast-region">
        {error && (
          <div className="toast error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{ui(error, language)}</span>
            {failed.current && (
              <>
                <button className="editor-control" onClick={() => void flush()}>
                  {ui("Retry save", language)}
                </button>
                <button
                  className="editor-control primary"
                  onClick={() => void exportDrawing("excalidraw", true)}
                >
                  <Download />
                  {ui("Download backup", language)}
                </button>
              </>
            )}
            <button
              className="icon-button"
              aria-label={ui("Dismiss error", language)}
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <span>{ui(notice.text, language)}</span>
            {notice.action && (
              <button
                className="editor-control primary"
                onClick={() => {
                  notice.action!.run();
                  setNotice(null);
                }}
              >
                {ui(notice.action.label, language)}
              </button>
            )}
            <button
              className="icon-button"
              aria-label={ui("Dismiss notification", language)}
              onClick={() => setNotice(null)}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
      <HindiTyping mode={typingMode} language={language} />
      <div className="editor-workspace">
        <main
          className="editor-surface"
          lang={editorLanguage}
          onDropCapture={(e) => {
            const file = e.dataTransfer.files[0];
            if (file && !file.type.startsWith("image/")) {
              e.preventDefault();
              e.stopPropagation();
              void importFile(file);
            }
          }}
        >
          {initial ? (
            <Excalidraw
              initialData={initial}
              excalidrawAPI={setApi}
              onChange={queue}
              theme={dark ? "dark" : "light"}
              langCode={editorLanguage}
              name={title}
              aiEnabled={false}
              validateEmbeddable={false}
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  saveToActiveFile: false,
                  export: false,
                },
              }}
            >
              <MainMenu>
                <MainMenu.Item
                  onSelect={() => void newDrawing()}
                  icon={<FilePlus2 />}
                >
                  {ui("New drawing", language)}
                </MainMenu.Item>
                <MainMenu.Item
                  onSelect={() => void openDocuments()}
                  icon={<FolderOpen />}
                >
                  {ui("Saved drawings", language)}
                </MainMenu.Item>
                <MainMenu.Item
                  onSelect={() => fileInput.current?.click()}
                  icon={<Upload />}
                >
                  {ui("Import native file", language)}
                </MainMenu.Item>
                <MainMenu.Item
                  onSelect={() => void exportDrawing("excalidraw")}
                  icon={<Download />}
                >
                  {ui("Download editable backup", language)}
                </MainMenu.Item>
                <MainMenu.DefaultItems.SaveAsImage />
                <MainMenu.DefaultItems.ChangeCanvasBackground />
              </MainMenu>
            </Excalidraw>
          ) : (
            <div className="editor-loading">
              {ui("Restoring your canvas…", language)}
            </div>
          )}
          {onboard && (
            <div className="onboarding">
              <span className="eyebrow">
                {ui("A LITTLE SPACE FOR A BIG IDEA", language)}
              </span>
              <h2>{ui("Make yourself at home.", language)}</h2>
              <p>
                {ui(
                  "Pick a tool above, or press R for a rectangle, P for a pen, and T for text. Hold Space to move around.",
                  language,
                )}
              </p>
              <p>
                {ui(
                  "Your work saves on this device. Export a backup before clearing browser data.",
                  language,
                )}
              </p>
              <button
                className="button primary"
                onClick={() => setOnboard(false)}
              >
                {ui("Let’s draw", language)} <Check size={15} />
              </button>
            </div>
          )}
          {api && ghost && <AssistantGhost api={api} elements={ghost} />}
        </main>
        {assistantOpen && api && (
          <div id="diagram-assistant-panel" className="assistant-panel-slot">
            <DiagramAssistant
              api={api}
              language={language}
              onPreview={setGhost}
              onClose={() => {
                setGhost(null);
                setAssistantOpen(false);
                assistantToggle.current?.focus();
              }}
              onApplied={() => setOnboard(false)}
            />
          </div>
        )}
      </div>
      <div className="editor-bottom">
        <span>
          {online
            ? ui("Local-first · no account needed", language)
            : ui("Offline · drawing stays on this device", language)}
        </span>
        <span role="status">{ui(cacheStatus, language)}</span>
        {language === "te" && (
          <span className="locale-note">
            గమనిక: కొన్ని అధునాతన సాధనాల ఎంపికలు ఆంగ్లంలో కనిపిస్తాయి. (Some
            advanced tool options use English.)
          </span>
        )}
        <button
          className="editor-control small"
          onClick={() => {
            if (navigator.storage?.persist)
              void navigator.storage
                .persist()
                .then((granted) =>
                  notify(
                    granted
                      ? "Persistent storage granted. Keep exported backups too."
                      : "The browser did not grant persistent storage. Export backups regularly.",
                  ),
                )
                .catch((e) => setError(saveError(e)));
            else
              notify(
                "Persistent storage is not supported by this browser. Export a backup to keep your work.",
              );
          }}
        >
          {ui("Protect local storage", language)}
        </button>
        <span className="backup-reminder">
          {ui(
            "Clearing browser data deletes local drawings. Export a backup.",
            language,
          )}
          <button
            className="editor-control small"
            disabled={!api}
            onClick={() => void exportDrawing("excalidraw", true)}
          >
            <Download />
            {ui("Download backup", language)}
          </button>
        </span>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
          >
            <div className="modal-head">
              <h2 id="modal-title">
                {modal === "templates"
                  ? ui("A head start for your idea.", language)
                  : modal === "name"
                    ? ui("Name your drawing", language)
                    : ui("Your local drawings", language)}
              </h2>
              <button
                className="icon-button"
                aria-label={ui("Close dialog", language)}
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>
            {modal === "name" ? (
              <form
                className="name-prompt"
                onSubmit={(e) => {
                  e.preventDefault();
                  const format = namePrompt ?? "excalidraw";
                  const next = draftName.trim();
                  if (next) rename(next.slice(0, 120));
                  setModal(null);
                  void exportDrawing(format, true);
                }}
              >
                <p>
                  {ui(
                    "A name makes this drawing easy to find in your saved drawings and downloads.",
                    language,
                  )}
                </p>
                <input
                  data-autofocus
                  aria-label={ui("Drawing title", language)}
                  placeholder={ui("For example: Science project", language)}
                  value={draftName}
                  maxLength={120}
                  onChange={(e) => setDraftName(e.target.value)}
                />
                <div className="name-prompt-actions">
                  <button className="button primary" type="submit">
                    <Download size={15} />
                    {ui(
                      draftName.trim()
                        ? "Save name and download"
                        : "Download without a name",
                      language,
                    )}
                  </button>
                </div>
              </form>
            ) : modal === "templates" ? (
              <>
                <TemplateFilters filter={templateFilter} language={language} />
                {!templateFilter.visible.length && (
                  <p>
                    {ui("No templates match. Try another search.", language)}
                  </p>
                )}
                <div className="template-grid">
                  {templateFilter.visible.map((template) => (
                    <button
                      key={template.id}
                      className="template-card"
                      style={{
                        textAlign: "left",
                        color: "inherit",
                        padding: 0,
                      }}
                      onClick={() => void newDrawing(template.id)}
                    >
                      <div className="template-art">
                        <Diagram template={template} />
                      </div>
                      <div className="template-info">
                        <span className="eyebrow">
                          {ui(template.category, language)}
                        </span>
                        <h3>{template.name}</h3>
                        <p>{template.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="storage-note">
                  {ui(
                    "Saved only in this browser. Export native files for backup.",
                    language,
                  )}
                </p>
                {!documents.length && (
                  <p>{ui("No drawings saved yet.", language)}</p>
                )}
                {documents.map((doc) => (
                  <a
                    className="document-row"
                    href={`/draw?id=${encodeURIComponent(doc.id)}`}
                    key={doc.id}
                  >
                    <span>
                      {doc.title || t("title")}
                      <small>{new Date(doc.updatedAt).toLocaleString()}</small>
                    </span>
                    <FolderOpen size={17} />
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
