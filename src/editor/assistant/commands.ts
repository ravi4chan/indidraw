import { newId } from "../newId";
/** Provider-independent command boundary. Never execute model-generated code. */
export type Shape = "rectangle" | "ellipse" | "diamond";
export type Operation =
  | { type: "add_node"; id: string; label: string; shape: Shape }
  | { type: "connect_nodes"; id: string; from: string; to: string }
  | { type: "rename_node"; id: string; label: string };
export interface Batch {
  version: 1;
  id: string;
  operations: Operation[];
}
export interface NodeReference {
  id: string;
  label: string;
}
/** An existing arrow between two assistant shapes, by shape id. */
export type Connection = readonly [from: string, to: string];

/**
 * A user-facing assistant failure. `key` is an English template with
 * `{name}` placeholders; the panel translates the template and then fills in
 * the values, so labels are never sent through translation.
 */
export class AssistantError extends Error {
  constructor(
    readonly key: string,
    readonly params: Readonly<Record<string, string>> = {},
  ) {
    super(fill(key, params));
    this.name = "AssistantError";
  }
}
export function fill(
  template: string,
  params: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? params[name] : match,
  );
}
const identifier = /^[a-zA-Z0-9_-]{1,100}$/;
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function validId(value: unknown): value is string {
  return typeof value === "string" && identifier.test(value);
}
function validLabel(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= 120
  );
}
export function validateBatch(value: unknown): Batch {
  if (
    !record(value) ||
    value.version !== 1 ||
    !validId(value.id) ||
    !Array.isArray(value.operations) ||
    !value.operations.length ||
    value.operations.length > 60
  )
    throw new AssistantError(
      "Use a version 1 command batch with 1–60 operations.",
    );
  for (const op of value.operations) {
    if (!record(op) || !validId(op.id))
      throw new AssistantError("Invalid operation identifier.");
    if (op.type === "add_node") {
      if (
        !validLabel(op.label) ||
        !["rectangle", "ellipse", "diamond"].includes(String(op.shape))
      )
        throw new AssistantError(
          "Choose a box, ellipse or diamond with a label of up to 120 characters.",
        );
    } else if (op.type === "rename_node") {
      if (!validLabel(op.label))
        throw new AssistantError("Use a label of up to 120 characters.");
    } else if (op.type === "connect_nodes") {
      if (!validId(op.from) || !validId(op.to) || op.from === op.to)
        throw new AssistantError(
          "Connect two different nodes using valid identifiers.",
        );
    } else throw new AssistantError("This diagram operation is not supported.");
  }
  // Return only recognised fields: no arbitrary model properties reach the canvas.
  return {
    version: 1,
    id: value.id,
    operations: value.operations.map((op: Record<string, unknown>) => {
      if (op.type === "add_node")
        return { type: op.type, id: op.id, label: op.label, shape: op.shape };
      if (op.type === "rename_node")
        return { type: op.type, id: op.id, label: op.label };
      return { type: op.type, id: op.id, from: op.from, to: op.to };
    }) as Operation[],
  };
}

/** Arrows accepted between labels: → -> => ⟶ */
const arrow = /\s*(?:->|→|=>|⟶)\s*/;
const shapeWords: Record<string, Shape> = {
  box: "rectangle",
  rectangle: "rectangle",
  rect: "rectangle",
  square: "rectangle",
  ellipse: "ellipse",
  circle: "ellipse",
  oval: "ellipse",
  diamond: "diamond",
  decision: "diamond",
};
const shapeLine = new RegExp(
  `^(?:(?:add|draw|create|make|insert|new)\\s+)?(?:(?:a|an|one)\\s+)?(${Object.keys(shapeWords).join("|")})\\s*:?\\s+(?:(?:called|named|labelled|labeled|saying|for)\\s+)?(.+)$`,
  "i",
);
/** Splits "A → B", "A to B" or quoted "A" to "B" into two labels. */
function pair(text: string, words: RegExp): [string, string] | undefined {
  const quoted = new RegExp(
    `^(["“][^"”]+["”])\\s*(?:->|→|=>|⟶|${words.source})\\s*(["“][^"”]+["”])$`,
    "i",
  ).exec(text);
  if (quoted) return [quoted[1], quoted[2]];
  const byArrow = text.split(arrow);
  if (byArrow.length === 2) return [byArrow[0], byArrow[1]];
  if (byArrow.length > 2) return;
  const match = new RegExp(`^(.+?)\\s+(?:${words.source})\\s+(.+)$`, "i").exec(
    text,
  );
  return match ? [match[1], match[2]] : undefined;
}

/**
 * Explicit offline grammar for exercising the engine before voice/AI is
 * connected. Flows reuse shapes that already exist, so a diagram can be built
 * up over several instructions ("Roof → Filter", then "Filter → Tank").
 */
export function planCommands(
  text: string,
  existing: NodeReference[],
  makeId: () => string = newId,
  connections: readonly Connection[] = [],
): Batch {
  if (!text.trim() || text.length > 4000)
    throw new AssistantError("Enter a command of up to 4,000 characters.");
  const nodes = existing.map((node) => ({ ...node }));
  const operations: Operation[] = [];
  const linked = new Set(connections.map(([from, to]) => `${from}\n${to}`));
  const clean = (label: string) =>
    label
      .trim()
      .replace(/^["“'‘]|["”'’]$/g, "")
      .trim();
  const same = (a: string, b: string) =>
    a.toLocaleLowerCase() === b.toLocaleLowerCase();
  const find = (label: string) => {
    const name = clean(label);
    const matches = nodes.filter((node) => same(node.label, name));
    if (matches.length > 1)
      throw new AssistantError(
        "More than one shape is called “{name}”. Give it a unique name first.",
        { name },
      );
    return matches[0];
  };
  const resolve = (label: string) => {
    const node = find(label);
    if (!node)
      throw new AssistantError(
        "No assistant shape called “{name}”. Create it first.",
        { name: clean(label) },
      );
    return node;
  };
  const add = (label: string, shape: Shape) => {
    const name = clean(label);
    if (!validLabel(name))
      throw new AssistantError("Each shape needs a label of 1–120 characters.");
    if (find(name))
      throw new AssistantError(
        "A shape called “{name}” already exists. Connect or rename it instead.",
        { name },
      );
    const node = { id: makeId(), label: name };
    nodes.push(node);
    operations.push({ type: "add_node", ...node, shape });
    return node;
  };
  const connect = (from: NodeReference, to: NodeReference, strict: boolean) => {
    if (from.id === to.id)
      throw new AssistantError("“{name}” can’t be connected to itself.", {
        name: from.label,
      });
    const key = `${from.id}\n${to.id}`;
    if (linked.has(key)) {
      if (strict)
        throw new AssistantError("“{from}” is already connected to “{to}”.", {
          from: from.label,
          to: to.label,
        });
      return; // A flow that repeats an existing arrow just continues from it.
    }
    linked.add(key);
    operations.push({
      type: "connect_nodes",
      id: makeId(),
      from: from.id,
      to: to.id,
    });
  };
  const lines = text
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/[.।]+$/, "")
        .trim(),
    )
    .filter(Boolean);
  for (const line of lines) {
    const rename = /^rename\s+(.+)$/i.exec(line);
    const link = /^(?:connect|link|join)\s+(.+)$/i.exec(line);
    const shape = shapeLine.exec(line);
    const flow = /^(?:flow:\s*)?(.+?(?:->|→|=>|⟶).+)$/i.exec(line);
    if (rename) {
      const parts = pair(rename[1], /to|as|→|->/);
      if (!parts) throw grammarError();
      const node = resolve(parts[0]);
      const label = clean(parts[1]);
      if (!validLabel(label))
        throw new AssistantError("Use a label of up to 120 characters.");
      if (
        nodes.some((other) => other.id !== node.id && same(other.label, label))
      )
        throw new AssistantError("A shape called “{name}” already exists.", {
          name: label,
        });
      operations.push({ type: "rename_node", id: node.id, label });
      node.label = label;
    } else if (link) {
      const parts = pair(link[1], /to|with|and/);
      if (!parts) throw grammarError();
      connect(resolve(parts[0]), resolve(parts[1]), true);
    } else if (flow) {
      let previous: NodeReference | undefined;
      for (const label of flow[1].split(arrow)) {
        if (!clean(label))
          throw new AssistantError(
            "Each shape needs a label of 1–120 characters.",
          );
        // Reuse a shape that already has this label; otherwise create it.
        const current = find(label) ?? add(label, "rectangle");
        if (previous) connect(previous, current, false);
        previous = current;
      }
    } else if (shape) {
      add(shape[2], shapeWords[shape[1].toLowerCase()]);
    } else throw grammarError();
  }
  if (!operations.length)
    throw new AssistantError(
      "Nothing to add: those shapes and arrows already exist.",
    );
  return validateBatch({ version: 1, id: makeId(), operations });
}
function grammarError() {
  return new AssistantError(
    'Use a flow such as Roof → Filter → Tank, box "Student", connect "A" → "B", or rename "A" to "B".',
  );
}
