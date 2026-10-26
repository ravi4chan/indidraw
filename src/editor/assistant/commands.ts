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
    throw new Error("Use a version 1 command batch with 1–60 operations.");
  for (const op of value.operations) {
    if (!record(op) || !validId(op.id))
      throw new Error("Invalid operation identifier.");
    if (op.type === "add_node") {
      if (
        !validLabel(op.label) ||
        !["rectangle", "ellipse", "diamond"].includes(String(op.shape))
      )
        throw new Error(
          "Choose a box, ellipse or diamond with a label of up to 120 characters.",
        );
    } else if (op.type === "rename_node") {
      if (!validLabel(op.label))
        throw new Error("Use a label of up to 120 characters.");
    } else if (op.type === "connect_nodes") {
      if (!validId(op.from) || !validId(op.to) || op.from === op.to)
        throw new Error("Connect two different nodes using valid identifiers.");
    } else throw new Error("This diagram operation is not supported.");
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

/** Explicit offline grammar for exercising the engine before voice/AI is connected. */
export function planCommands(
  text: string,
  existing: NodeReference[],
  makeId: () => string = () => crypto.randomUUID(),
): Batch {
  if (!text.trim() || text.length > 4000)
    throw new Error("Enter a command of up to 4,000 characters.");
  const nodes = existing.map((node) => ({ ...node }));
  const operations: Operation[] = [];
  const clean = (label: string) =>
    label
      .trim()
      .replace(/^["“]|["”]$/g, "")
      .trim();
  const resolve = (label: string) => {
    const matches = nodes.filter(
      (node) =>
        node.label.toLocaleLowerCase() === clean(label).toLocaleLowerCase(),
    );
    if (matches.length !== 1)
      throw new Error(
        matches.length
          ? `More than one shape is called “${clean(label)}”. Give it a unique name first.`
          : `No assistant shape called “${clean(label)}”. Create it first.`,
      );
    return matches[0];
  };
  const add = (label: string, shape: Shape) => {
    const name = clean(label);
    if (!validLabel(name))
      throw new Error("Each shape needs a label of 1–120 characters.");
    if (
      nodes.some(
        (node) => node.label.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      throw new Error(
        `A shape called “${name}” already exists. Connect or rename it instead.`,
      );
    const node = { id: makeId(), label: name };
    nodes.push(node);
    operations.push({ type: "add_node", ...node, shape });
    return node;
  };
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const rename = /^rename\s+"([^"]+)"\s+to\s+"([^"]+)"$/i.exec(line);
    const connect = /^connect\s+(.+?)\s*(?:->|→)\s*(.+)$/i.exec(line);
    const shape = /^(?:add\s+)?(box|rectangle|ellipse|diamond)\s+(.+)$/i.exec(
      line,
    );
    const flow = /^(?:flow:\s*)?(.+?(?:->|→).+)$/i.exec(line);
    if (rename) {
      const node = resolve(rename[1]);
      const label = clean(rename[2]);
      if (
        nodes.some(
          (other) =>
            other.id !== node.id &&
            other.label.toLocaleLowerCase() === label.toLocaleLowerCase(),
        )
      )
        throw new Error(`A shape called “${label}” already exists.`);
      operations.push({ type: "rename_node", id: node.id, label });
      node.label = label;
    } else if (connect) {
      operations.push({
        type: "connect_nodes",
        id: makeId(),
        from: resolve(connect[1]).id,
        to: resolve(connect[2]).id,
      });
    } else if (shape) {
      add(
        shape[2],
        shape[1].toLowerCase() === "box"
          ? "rectangle"
          : (shape[1].toLowerCase() as Shape),
      );
    } else if (flow) {
      const labels = flow[1].split(/->|→/);
      let previous: NodeReference | undefined;
      for (const label of labels) {
        const current = add(label, "rectangle");
        if (previous)
          operations.push({
            type: "connect_nodes",
            id: makeId(),
            from: previous.id,
            to: current.id,
          });
        previous = current;
      }
    } else
      throw new Error(
        'Use a flow such as Roof → Filter → Tank, box "Student", connect "A" → "B", or rename "A" to "B".',
      );
  }
  return validateBatch({ version: 1, id: makeId(), operations });
}
