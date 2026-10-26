import {
  convertToExcalidrawElements,
  newElementWith,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawTextElement,
} from "@excalidraw/excalidraw/element/types";
import { validateBatch, type NodeReference } from "./commands";
import { labelFont } from "../labelFont";

const key = "indidrawAssistant";
function receipts(element: ExcalidrawElement): string[] {
  const value: unknown = element.customData?.[key]?.batches;
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string").slice(-256)
    : [];
}
function isNode(element: ExcalidrawElement) {
  return (
    !element.isDeleted &&
    ["rectangle", "ellipse", "diamond"].includes(element.type) &&
    element.customData?.[key]?.version === 1
  );
}
export function assistantNodes(
  elements: readonly ExcalidrawElement[],
): NodeReference[] {
  return elements.filter(isNode).map((element) => ({
    id: element.id,
    label:
      elements.find(
        (label): label is ExcalidrawTextElement =>
          !label.isDeleted &&
          label.type === "text" &&
          label.containerId === element.id,
      )?.originalText ?? "",
  }));
}
export function sceneRevision(elements: readonly ExcalidrawElement[]) {
  return JSON.stringify(
    elements.map((element) => [
      element.id,
      element.version,
      element.versionNonce,
      element.isDeleted,
    ]),
  );
}
/**
 * Reverses an applied batch as one new history step: shapes it created are
 * deleted and shapes it changed get their earlier properties back.
 */
export function revertBatch(
  before: readonly ExcalidrawElement[],
  after: readonly ExcalidrawElement[],
): ExcalidrawElement[] {
  const previous = new Map(before.map((element) => [element.id, element]));
  return after.map((element) => {
    const old = previous.get(element.id);
    if (!old) return newElementWith(element, { isDeleted: true });
    if (old === element) return element;
    const restored: Record<string, unknown> = { ...old };
    for (const key of ["id", "version", "versionNonce", "updated"])
      delete restored[key];
    return newElementWith(
      element,
      restored as Parameters<typeof newElementWith>[1],
      true,
    );
  });
}
/** Atomic native-scene transaction; callers commit once with IMMEDIATELY. */
export function applyBatch(
  source: readonly ExcalidrawElement[],
  value: unknown,
): ExcalidrawElement[] {
  const batch = validateBatch(value);
  // A replayed delivery is a no-op. Receipts travel with native scene elements.
  if (source.some((element) => receipts(element).includes(batch.id)))
    return [...source];
  let elements = [...source];
  const idSet = new Set(elements.map((element) => element.id));
  const node = (id: string) => {
    const result = elements.find(
      (element) => element.id === id && isNode(element),
    );
    if (!result)
      throw new Error(
        "An assistant shape is missing. Preview the instruction again.",
      );
    if (result.locked || result.angle !== 0 || result.frameId)
      throw new Error(
        "Unlock the shape and move it out of rotated or framed layouts before changing it here.",
      );
    return result;
  };
  const receipt = (element: ExcalidrawElement) => ({
    ...element.customData,
    [key]: {
      version: 1,
      batches: [...receipts(element), batch.id].slice(-256),
    },
  });
  for (const op of batch.operations) {
    if (op.type === "add_node") {
      if (idSet.has(op.id))
        throw new Error("A shape identifier already exists.");
      // Conservative placement checks the whole drawing, including hand-drawn work.
      const width = Math.max(
        190,
        Math.min(360, Array.from(op.label).length * 11 + 40),
      );
      const height = op.shape === "diamond" ? 140 : 100;
      let x = 80,
        y = 100,
        available = false;
      for (let slot = 0; slot < 3000; slot++) {
        const row = Math.floor(slot / 3);
        x = 80 + (row % 2 === 0 ? slot % 3 : 2 - (slot % 3)) * 420;
        y = 100 + row * 220;
        if (
          !elements.some(
            (e) =>
              !e.isDeleted &&
              e.type !== "arrow" &&
              e.type !== "line" &&
              x < e.x + e.width + 30 &&
              x + width + 30 > e.x &&
              y < e.y + e.height + 30 &&
              y + height + 30 > e.y,
          )
        ) {
          available = true;
          break;
        }
      }
      if (!available)
        throw new Error(
          "No clear space found. Start a new drawing for this diagram.",
        );
      const created = convertToExcalidrawElements(
        [
          {
            type: op.shape,
            id: op.id,
            x,
            y,
            width,
            height,
            strokeColor: "#0f3b82",
            backgroundColor: "#edf4ff",
            fillStyle: "solid",
            roughness: 1,
            roundness: op.shape === "rectangle" ? { type: 3 } : null,
            customData: { [key]: { version: 1, batches: [batch.id] } },
            label: {
              text: op.label,
              fontSize: 20,
              fontFamily: labelFont(op.label),
            },
          },
        ],
        { regenerateIds: false },
      );
      elements.push(...created);
      created.forEach((element) => idSet.add(element.id));
    } else if (op.type === "rename_node") {
      const target = node(op.id);
      const label = elements.find(
        (e): e is ExcalidrawTextElement =>
          !e.isDeleted && e.type === "text" && e.containerId === target.id,
      );
      if (!label || label.locked)
        throw new Error(
          "This shape has no editable label. Add a label on the canvas first.",
        );
      const measured = convertToExcalidrawElements(
        [
          {
            ...structuredClone(target),
            type: target.type as "rectangle" | "ellipse" | "diamond",
            label: {
              text: op.label,
              fontSize: label.fontSize,
              fontFamily: label.fontFamily,
              textAlign: label.textAlign,
              verticalAlign: label.verticalAlign,
            },
          },
        ],
        { regenerateIds: false },
      );
      const container = measured.find((e) => e.id === target.id)!;
      const text = measured.find((e) => e.type === "text");
      if (!text || text.type !== "text")
        throw new Error("Could not measure the new label.");
      // Enlarging a connected container requires rerouting; reject rather than
      // silently corrupt a manually adjusted connector in this first adapter.
      if (
        (container.width !== target.width ||
          container.height !== target.height) &&
        target.boundElements?.some((e) => e.type === "arrow")
      )
        throw new Error(
          "This label needs more space. Resize the connected shape on the canvas, then preview again.",
        );
      elements = elements.map((e) =>
        e.id === target.id
          ? newElementWith(e, {
              width: container.width,
              height: container.height,
              customData: receipt(e),
            })
          : e.id === label.id
            ? newElementWith(label, {
                text: text.text,
                originalText: op.label,
                x: text.x,
                y: text.y,
                width: text.width,
                height: text.height,
                customData: receipt(label),
              })
            : e,
      );
    } else {
      const from = node(op.from),
        to = node(op.to);
      if (idSet.has(op.id))
        throw new Error("A connection identifier already exists.");
      if (
        elements.some(
          (e) =>
            !e.isDeleted &&
            e.type === "arrow" &&
            e.startBinding?.elementId === from.id &&
            e.endBinding?.elementId === to.id,
        )
      )
        throw new Error(
          "These shapes are already connected in that direction.",
        );
      const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
      const sign = horizontal
        ? to.x > from.x
          ? 1
          : -1
        : to.y > from.y
          ? 1
          : -1;
      const x1 =
        from.x +
        from.width / 2 +
        (horizontal ? sign * (from.width / 2 + 8) : 0);
      const y1 =
        from.y +
        from.height / 2 +
        (horizontal ? 0 : sign * (from.height / 2 + 8));
      const x2 =
        to.x + to.width / 2 - (horizontal ? sign * (to.width / 2 + 8) : 0);
      const y2 =
        to.y + to.height / 2 - (horizontal ? 0 : sign * (to.height / 2 + 8));
      const created = convertToExcalidrawElements(
        [
          {
            id: op.id,
            type: "arrow",
            x: x1,
            y: y1,
            points: [
              [0, 0],
              [x2 - x1, y2 - y1],
            ],
            strokeColor: "#0f3b82",
            endArrowhead: "arrow",
            roughness: 1,
            customData: { [key]: { version: 1, batches: [batch.id] } },
          },
        ],
        { regenerateIds: false },
      );
      elements = elements.map((e) =>
        e.id === from.id || e.id === to.id
          ? newElementWith(e, {
              boundElements: [
                ...(e.boundElements ?? []),
                { id: op.id, type: "arrow" },
              ],
              customData: receipt(e),
            })
          : e,
      );
      // Skeleton conversion drops references to elements outside its input.
      // Attach bindings after conversion to preserve the existing native nodes.
      elements.push(
        ...created.map((e) =>
          e.type === "arrow"
            ? newElementWith(e, {
                startBinding: { elementId: from.id, focus: 0, gap: 8 },
                endBinding: { elementId: to.id, focus: 0, gap: 8 },
              })
            : e,
        ),
      );
      idSet.add(op.id);
    }
  }
  if (elements.length > 10000)
    throw new Error("This drawing has reached its 10,000-element limit.");
  return elements;
}
