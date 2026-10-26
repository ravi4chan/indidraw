export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const kinds = new Set([
  "rectangle",
  "diamond",
  "ellipse",
  "line",
  "arrow",
  "freedraw",
  "text",
  "image",
  "frame",
  "magicframe",
  "embeddable",
  "iframe",
]);
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export interface NativeScene {
  type: "excalidraw";
  version: number;
  elements: Record<string, unknown>[];
  appState: Record<string, unknown>;
  files: Record<
    string,
    { id: string; dataURL: string; mimeType: string; created: number }
  >;
}
export function validateScene(
  text: string,
  source: "import" | "local" = "import",
): NativeScene {
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES)
    throw new Error("Drawing exceeds the 20 MB import limit.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !record(raw) ||
    raw.type !== "excalidraw" ||
    raw.version !== 2 ||
    !Array.isArray(raw.elements) ||
    raw.elements.length > 10000
  )
    throw new Error(
      "Choose a supported version 2 .excalidraw file (up to 10,000 elements).",
    );
  const ids = new Set<string>();
  for (const el of raw.elements) {
    if (
      !record(el) ||
      typeof el.type !== "string" ||
      !kinds.has(el.type) ||
      typeof el.id !== "string"
    )
      throw new Error("Unsupported drawing element.");
    if (ids.has(el.id as string))
      throw new Error("Duplicate element identifiers are not supported.");
    ids.add(el.id as string);
    for (const [field, max] of [
      ["fontSize", 500],
      ["strokeWidth", 100],
      ["opacity", 100],
    ] as const)
      if (
        el[field] != null &&
        (typeof el[field] !== "number" ||
          !Number.isFinite(el[field]) ||
          (el[field] as number) < 0 ||
          (el[field] as number) > max)
      )
        throw new Error("Invalid drawing style.");
    if (["iframe", "embeddable", "magicframe"].includes(el.type))
      throw new Error(
        "External embeds and generated frames are not supported in local imports.",
      );
    for (const field of ["x", "y", "width", "height"])
      if (
        typeof el[field] !== "number" ||
        !Number.isFinite(el[field]) ||
        Math.abs(el[field] as number) > 1e7
      )
        throw new Error("Invalid drawing coordinates.");
    if (typeof el.text === "string" && el.text.length > 100000)
      throw new Error("A text element is too large.");
    if (el.type === "freedraw" || el.type === "line" || el.type === "arrow") {
      if (
        !Array.isArray(el.points) ||
        el.points.length > 100000 ||
        el.points.some(
          (p) =>
            !Array.isArray(p) ||
            p.length !== 2 ||
            p.some(
              (n) =>
                typeof n !== "number" ||
                !Number.isFinite(n) ||
                Math.abs(n) > 1e7,
            ),
        )
      )
        throw new Error("Invalid drawing points.");
    }
    // Scene links must never execute code. Only regular web links are retained.
    if (
      el.link != null &&
      (typeof el.link !== "string" || !/^https?:\/\//i.test(el.link))
    )
      el.link = null;
  }
  const files = record(raw.files) ? raw.files : {};
  for (const [id, file] of Object.entries(files)) {
    if (
      !record(file) ||
      file.id !== id ||
      typeof file.dataURL !== "string" ||
      typeof file.mimeType !== "string" ||
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        ...(source === "local" ? ["image/svg+xml"] : []),
      ].includes(file.mimeType) ||
      !file.dataURL.startsWith(`data:${file.mimeType};base64,`) ||
      (!(source === "local" && file.mimeType === "image/svg+xml") &&
        !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/.test(
          file.dataURL,
        ))
    )
      throw new Error(
        "Only embedded PNG, JPEG, WebP and GIF images are supported. SVG and external images are rejected.",
      );
  }
  // Restore only appearance and view state, not arbitrary application controls.
  const state = record(raw.appState) ? raw.appState : {};
  const appState: Record<string, unknown> = {};
  if (
    typeof state.viewBackgroundColor === "string" &&
    /^#[\da-f]{3,8}$/i.test(state.viewBackgroundColor)
  )
    appState.viewBackgroundColor = state.viewBackgroundColor;
  return {
    type: "excalidraw",
    version: 2,
    elements: raw.elements,
    appState,
    files: files as NativeScene["files"],
  };
}
