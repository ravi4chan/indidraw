import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  FileDown,
  FilePlus2,
  FileText,
  FolderOpen,
  Image,
  LayoutTemplate,
  Upload,
} from "lucide-react";
import { ui, type LanguageCode } from "../i18n/languages";

export type ExportFormat = "excalidraw" | "png" | "svg";

/** One styled menu for document actions, replacing a row of buttons and a native select. */
export default function FileMenu({
  language,
  disabled,
  exportDisabled,
  onNew,
  onOpen,
  onTemplates,
  onImport,
  onExport,
}: {
  language: LanguageCode;
  disabled: boolean;
  exportDisabled: boolean;
  onNew: () => void;
  onOpen: () => void;
  onTemplates: () => void;
  onImport: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const outside = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !button.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const run = (action: () => void) => () => {
    close(false);
    action();
  };
  const item = (
    label: string,
    icon: ReactNode,
    action: () => void,
    itemDisabled = false,
    format?: ExportFormat,
  ) => (
    <button
      type="button"
      role="menuitem"
      data-export={format}
      tabIndex={-1}
      disabled={itemDisabled}
      onClick={run(action)}
    >
      {icon}
      {ui(label, language)}
    </button>
  );
  return (
    <div className="file-menu">
      <button
        ref={button}
        type="button"
        className="editor-control"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="file-menu-list"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <FileText />
        <span className="control-label">{ui("File", language)}</span>
        <ChevronDown />
      </button>
      {open && (
        <div
          ref={menu}
          id="file-menu-list"
          className="file-menu-list"
          role="menu"
          aria-label={ui("File", language)}
          onKeyDown={(event) => {
            const items = [
              ...(menu.current?.querySelectorAll<HTMLElement>(
                "[role=menuitem]:not(:disabled)",
              ) ?? []),
            ];
            const index = items.indexOf(document.activeElement as HTMLElement);
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            } else if (event.key === "Tab") close(false);
            else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              items.at((index + step) % items.length)?.focus();
            } else if (event.key === "Home") items[0]?.focus();
            else if (event.key === "End") items.at(-1)?.focus();
          }}
        >
          {item("New drawing", <FilePlus2 />, onNew)}
          {item("Open saved drawing…", <FolderOpen />, onOpen)}
          {item("Start from a template…", <LayoutTemplate />, onTemplates)}
          {item("Import .excalidraw file…", <Upload />, onImport)}
          <div className="file-menu-group" role="presentation">
            {ui("Download a copy", language)}
          </div>
          {item(
            "Editable backup (.excalidraw)",
            <FileDown />,
            () => onExport("excalidraw"),
            exportDisabled,
            "excalidraw",
          )}
          {item(
            "PNG image",
            <Image />,
            () => onExport("png"),
            exportDisabled,
            "png",
          )}
          {item(
            "SVG image",
            <Image />,
            () => onExport("svg"),
            exportDisabled,
            "svg",
          )}
        </div>
      )}
    </div>
  );
}
