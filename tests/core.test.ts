import { describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  getDrawing,
  listDrawings,
  saveDrawing,
} from "../src/storage/documents";
import { validateScene, MAX_FILE_BYTES } from "../src/editor/validation";
import { templates, edgePoints } from "../src/templates/data";
const native = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: "excalidraw",
    version: 2,
    elements: [
      { id: "r", type: "rectangle", x: 10, y: 20, width: 100, height: 80 },
    ],
    files: {},
    ...extra,
  });
describe("native import validation", () => {
  it("accepts editable shapes and Unicode text", () => {
    const scene = validateScene(
      native({
        elements: [
          {
            id: "t",
            type: "text",
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            text: "नमस्ते भारत",
          },
        ],
      }),
    );
    expect(scene.elements[0].text).toBe("नमस्ते भारत");
  });
  it.each(["<svg/>", "{}", '{"type":"excalidraw","version":1,"elements":[]}'])(
    "rejects malformed or unsupported data: %s",
    (text) => expect(() => validateScene(text)).toThrow(),
  );
  it("rejects excessive files before parsing", () =>
    expect(() => validateScene(" ".repeat(MAX_FILE_BYTES + 1))).toThrow(
      /20 MB/,
    ));
  it("rejects unsafe images and external embeds", () => {
    expect(() =>
      validateScene(
        native({
          files: {
            x: {
              id: "x",
              mimeType: "image/svg+xml",
              dataURL: "data:image/svg+xml,<svg/>",
            },
          },
        }),
      ),
    ).toThrow(/embedded/);
    expect(() =>
      validateScene(
        native({
          elements: [
            { id: "x", type: "iframe", x: 0, y: 0, width: 1, height: 1 },
          ],
        }),
      ),
    ).toThrow(/embeds/);
  });
  it("rejects bad coordinates and points", () => {
    expect(() =>
      validateScene(
        native({
          elements: [
            { id: "r", type: "rectangle", x: "x", y: 0, width: 1, height: 1 },
          ],
        }),
      ),
    ).toThrow(/coordinates/);
    expect(() =>
      validateScene(
        native({
          elements: [
            {
              id: "r",
              type: "freedraw",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              points: [["bad", 0]],
            },
          ],
        }),
      ),
    ).toThrow(/points/);
  });
  it("drops executable links and untrusted app controls", () => {
    const scene = validateScene(
      native({
        elements: [
          {
            id: "r",
            type: "rectangle",
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            link: "javascript:alert(1)",
          },
        ],
        appState: { viewBackgroundColor: "#ffffff", viewModeEnabled: true },
      }),
    );
    expect(scene.elements[0].link).toBeNull();
    expect(scene.appState).toEqual({ viewBackgroundColor: "#ffffff" });
  });
  it("preserves embedded PNG files", () => {
    const file = {
      id: "image",
      mimeType: "image/png",
      dataURL: "data:image/png;base64,aGVsbG8=",
      created: 1,
    };
    expect(
      validateScene(native({ files: { image: file } })).files.image,
    ).toEqual(file);
  });
});
describe("transactional local drawings", () => {
  it("saves, reloads, and lists documents including embedded assets", async () => {
    const drawing = {
      id: "test-1",
      title: "नमस्ते",
      scene: native(),
      updatedAt: 12,
      revision: 1,
    };
    await saveDrawing(drawing);
    expect(await getDrawing(drawing.id)).toEqual(drawing);
    expect((await listDrawings()).some((d) => d.id === drawing.id)).toBe(true);
  });
  it("refuses to overwrite a newer saved revision", async () => {
    const drawing = {
      id: "conflict",
      title: "New",
      scene: native(),
      updatedAt: 12,
      revision: 20,
    };
    await saveDrawing(drawing);
    await expect(
      saveDrawing({ ...drawing, title: "Old", revision: 19 }),
    ).rejects.toThrow();
    expect((await getDrawing("conflict"))?.title).toBe("New");
  });
  it("returns undefined for missing documents", async () =>
    expect(await getDrawing("missing")).toBeUndefined());
});
describe("bundled templates", () => {
  it("has thirteen distinct editable templates, three in Hindi, with valid connections", () => {
    expect(templates).toHaveLength(13);
    expect(templates.filter((t) => t.language === "hi")).toHaveLength(3);
    expect(new Set(templates.map((t) => t.id)).size).toBe(13);
    for (const template of templates) {
      expect(template.nodes.length).toBeGreaterThan(0);
      for (const [from, to] of template.edges) {
        expect(template.nodes.some((n) => n.id === from)).toBe(true);
        expect(template.nodes.some((n) => n.id === to)).toBe(true);
        expect(
          Object.values(edgePoints(template, from, to)).every(Number.isFinite),
        ).toBe(true);
      }
    }
  });
});
