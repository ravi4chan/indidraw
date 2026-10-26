import { describe, expect, it } from "vitest";
import { planCommands, validateBatch } from "../src/editor/assistant/commands";

function planner() {
  let id = 0;
  return (text: string, nodes: { id: string; label: string }[] = []) =>
    planCommands(text, nodes, () => `test-${++id}`);
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
    expect(() => plan("A → a")).toThrow("already exists");
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
