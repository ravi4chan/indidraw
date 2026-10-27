import { describe, expect, it } from "vitest";
import {
  AssistantError,
  planCommands,
  validateBatch,
} from "../src/editor/assistant/commands";
import { newId } from "../src/editor/newId";

function planner() {
  let id = 0;
  return (
    text: string,
    nodes: { id: string; label: string }[] = [],
    connections: (readonly [string, string])[] = [],
  ) => planCommands(text, nodes, () => `test-${++id}`, connections);
}
describe("diagram command boundary", () => {
  it("plans an entire connected flow, including Unicode labels, with unique stable IDs", () => {
    const batch = planner()("वर्षा → छत → फ़िल्टर → पानी की टंकी");
    expect(batch.operations).toHaveLength(7);
    expect(
      batch.operations
        .filter((op) => op.type === "add_node")
        .map((op) => op.label),
    ).toEqual(["वर्षा", "छत", "फ़िल्टर", "पानी की टंकी"]);
    const ids = batch.operations.map((op) => op.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(batch.operations[2]).toEqual({
      type: "connect_nodes",
      id: "test-3",
      from: "test-1",
      to: "test-2",
    });
  });
  it("resolves explicit edits by current label, without changing the input graph", () => {
    const nodes = [{ id: "student", label: "Student" }];
    const batch = planner()(
      'rename "Student" to "Learner"\nbox "School"\nconnect "Learner" → "School"',
      nodes,
    );
    expect(batch.operations[0]).toEqual({
      type: "rename_node",
      id: "student",
      label: "Learner",
    });
    expect(nodes[0].label).toBe("Student");
    expect(batch.operations.at(-1)).toMatchObject({ from: "student" });
  });
  it("supports all three shapes", () => {
    expect(
      planner()('ellipse "Start"\nbox "Work"\ndiamond "Approved?"').operations,
    ).toMatchObject([
      { shape: "ellipse" },
      { shape: "rectangle" },
      { shape: "diamond" },
    ]);
  });
  it("rejects ambiguity, missing targets and accidental duplicates", () => {
    const plan = planner();
    expect(() =>
      plan('rename "A" to "B"', [
        { id: "a1", label: "A" },
        { id: "a2", label: "A" },
      ]),
    ).toThrow("More than one");
    expect(() => plan('connect "A" → "B"')).toThrow("Create it first");
    expect(() => plan("A → a")).toThrow("can’t be connected to itself");
    expect(() => plan('box "A"\nbox "a"')).toThrow("already exists");
    expect(() =>
      plan('rename "A" to "B"', [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ]),
    ).toThrow("already exists");
  });
  it("rejects unsupported prose and invalid or excessive input as a whole", () => {
    const plan = planner();
    for (const text of [
      "",
      "delete everything",
      "box A\nrun JavaScript",
      "A → ",
      "x".repeat(4001),
      Array.from({ length: 32 }, (_, i) => `Node ${i}`).join(" → "),
    ])
      expect(() => plan(text)).toThrow();
  });
  it("validates unknown provider payloads and strips unsolicited fields", () => {
    const batch = {
      version: 1,
      id: "batch",
      operations: [
        {
          type: "add_node",
          id: "a",
          label: "A",
          shape: "rectangle",
          javascript: "alert(1)",
        },
      ],
    };
    expect(validateBatch(batch).operations[0]).not.toHaveProperty("javascript");
    for (const value of [
      null,
      {},
      { ...batch, version: 2 },
      { ...batch, id: "bad/id" },
      { ...batch, operations: [{ type: "execute", id: "x" }] },
      {
        ...batch,
        operations: [
          { type: "add_node", id: "a", label: " ", shape: "rectangle" },
        ],
      },
      {
        ...batch,
        operations: [{ type: "connect_nodes", id: "x", from: "a", to: "a" }],
      },
    ])
      expect(() => validateBatch(value)).toThrow();
  });
});

describe("building a diagram over several instructions", () => {
  const roof = { id: "roof", label: "Roof" };
  const filter = { id: "filter", label: "Filter" };
  it("continues a flow from shapes that already exist instead of refusing", () => {
    // Regression: "Garden → Kitchen" after "Roof → … → Garden" used to fail
    // with “A shape called Garden already exists”.
    const batch = planner()("Filter → Tank", [roof, filter]);
    expect(batch.operations).toEqual([
      { type: "add_node", id: "test-1", label: "Tank", shape: "rectangle" },
      { type: "connect_nodes", id: "test-2", from: "filter", to: "test-1" },
    ]);
  });
  it("skips arrows that are already drawn when a flow repeats them", () => {
    const batch = planner()(
      "Roof → Filter → Tank",
      [roof, filter],
      [["roof", "filter"]],
    );
    expect(batch.operations.map((op) => op.type)).toEqual([
      "add_node",
      "connect_nodes",
    ]);
    expect(() =>
      planner()("roof → FILTER", [roof, filter], [["roof", "filter"]]),
    ).toThrow("Nothing to add");
    expect(() =>
      planner()(
        'connect "Roof" → "Filter"',
        [roof, filter],
        [["roof", "filter"]],
      ),
    ).toThrow("already connected");
  });
  it("connects existing shapes in both directions and in a loop", () => {
    const batch = planner()(
      "Filter → Roof",
      [roof, filter],
      [["roof", "filter"]],
    );
    expect(batch.operations).toEqual([
      { type: "connect_nodes", id: "test-1", from: "filter", to: "roof" },
    ]);
  });
});

describe("everyday phrasing", () => {
  const plan = (text: string, nodes: { id: string; label: string }[] = []) =>
    planner()(text, nodes).operations;
  const nodes = [
    { id: "roof", label: "Roof" },
    { id: "garden", label: "Garden" },
  ];
  it.each([
    ["add a box called Principal", "rectangle", "Principal"],
    ["draw a circle named Begin", "ellipse", "Begin"],
    ["create an oval called End.", "ellipse", "End"],
    ["diamond: Approved?", "diamond", "Approved?"],
    ["decision Pass?", "diamond", "Pass?"],
    ["Box Teacher", "rectangle", "Teacher"],
    ['rectangle "पानी की टंकी"', "rectangle", "पानी की टंकी"],
  ])("%s", (text, shape, label) => {
    expect(plan(text)).toEqual([
      { type: "add_node", id: "test-1", label, shape },
    ]);
  });
  it("connects with “to” as well as arrows", () => {
    for (const text of [
      "connect Roof to Garden",
      'connect "Roof" to "Garden"',
      "link roof → garden",
      "connect Roof -> Garden",
    ])
      expect(plan(text, nodes)).toEqual([
        { type: "connect_nodes", id: "test-1", from: "roof", to: "garden" },
      ]);
  });
  it("renames without quotes, and with quotes when a label contains “to”", () => {
    expect(plan("rename Roof to Terrace", nodes)).toEqual([
      { type: "rename_node", id: "roof", label: "Terrace" },
    ]);
    expect(plan('rename "Roof" to "Go to school"', nodes)).toEqual([
      { type: "rename_node", id: "roof", label: "Go to school" },
    ]);
  });
  it("reads a flow whose first label is a shape word as a flow", () => {
    expect(plan("Circle → Square").map((op) => op.type)).toEqual([
      "add_node",
      "add_node",
      "connect_nodes",
    ]);
  });
  it("accepts => and the Devanagari full stop", () => {
    expect(plan("वर्षा => छत।")).toHaveLength(3);
  });
});

describe("assistant errors are translatable", () => {
  it("keeps the English template and the label separately", () => {
    let error: unknown;
    try {
      planner()('connect "छत" → "Tank"');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(AssistantError);
    expect((error as AssistantError).key).toBe(
      "No assistant shape called “{name}”. Create it first.",
    );
    expect((error as AssistantError).params).toEqual({ name: "छत" });
    expect((error as AssistantError).message).toBe(
      "No assistant shape called “छत”. Create it first.",
    );
  });
});

describe("identifiers", () => {
  it("work without crypto.randomUUID (plain http on a phone)", () => {
    const original = crypto.randomUUID;
    try {
      Object.defineProperty(crypto, "randomUUID", {
        value: undefined,
        configurable: true,
      });
      const id = newId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(planCommands("A → B", []).operations).toHaveLength(3);
    } finally {
      Object.defineProperty(crypto, "randomUUID", {
        value: original,
        configurable: true,
      });
    }
  });
});
