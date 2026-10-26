import { test, expect } from "@playwright/test";
import { exportAs, fileMenu } from "./helpers";

const saved = (page: import("@playwright/test").Page) =>
  page.getByRole("status").filter({ hasText: "Saved on this device" });

test("a stale tab cannot overwrite a newer drawing, and can export its work", async ({
  page,
  context,
}) => {
  await page.goto("/draw?template=flowchart");
  await expect(saved(page)).toBeVisible();
  const title = page.getByRole("textbox", { name: "Drawing title" });
  await title.fill("Original QA drawing");
  await expect(saved(page)).toBeVisible();
  const other = await context.newPage();
  await other.goto(page.url());
  await expect(saved(other)).toBeVisible();
  await title.fill("Newer saved version");
  await expect(saved(page)).toBeVisible();
  await other
    .getByRole("textbox", { name: "Drawing title" })
    .fill("Stale tab unsaved version");
  await expect(
    other.getByRole("status").filter({ hasText: "Not saved" }),
  ).toBeVisible();
  await expect(other.getByRole("alert")).toContainText("another tab");
  const download = other.waitForEvent("download");
  await exportAs(other, "excalidraw");
  expect((await download).suggestedFilename()).toContain(
    "Stale tab unsaved version",
  );
  await page.reload();
  await expect(title).toHaveValue("Newer saved version");
});

test("geometry, true undo/redo, duplicate/delete and invalid import recovery", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /content security policy|refused to/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw?id=release-tools");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const bounds = await page.locator(".editor-surface").boundingBox();
  if (!bounds) throw new Error("Missing drawing surface");
  for (const [index, name] of [
    "Rectangle",
    "Diamond",
    "Ellipse",
    "Arrow",
    "Line",
  ].entries()) {
    await page.getByRole("radio", { name, exact: true }).check({ force: true });
    const x = 380 + (index % 3) * 220,
      y = bounds.y + 220 + Math.floor(index / 3) * 180;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 130, y + 90);
    await page.mouse.up();
  }
  async function elements() {
    const wait = page.waitForEvent("download");
    await exportAs(page, "excalidraw");
    const file = await (await wait).path();
    const scene = JSON.parse(await readFile(file!, "utf8")) as {
      elements: { type: string; isDeleted: boolean; groupIds: string[] }[];
    };
    return scene.elements.filter((e) => !e.isDeleted);
  }
  expect((await elements()).map((e) => e.type).sort()).toEqual([
    "arrow",
    "diamond",
    "ellipse",
    "line",
    "rectangle",
  ]);
  await page.getByRole("button", { name: /^Undo/ }).click();
  expect(await elements()).toHaveLength(4);
  await page.getByRole("button", { name: /^Redo/ }).click();
  expect(await elements()).toHaveLength(5);
  await page
    .getByRole("radio", { name: "Selection", exact: true })
    .check({ force: true });
  await page.mouse.click(1100, bounds.y + 500);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+g");
  expect((await elements()).every((e) => e.groupIds.length > 0)).toBe(true);
  await page.mouse.click(1100, bounds.y + 500);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+d");
  expect(await elements()).toHaveLength(10);
  // Export moves focus to the header; return focus to the canvas before deleting.
  await page.mouse.click(1100, bounds.y + 500);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  expect(await elements()).toHaveLength(0);
  await page.getByRole("button", { name: /^Undo/ }).click();
  expect(await elements()).toHaveLength(10);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.excalidraw",
    mimeType: "application/json",
    buffer: Buffer.from(
      '{"type":"excalidraw","version":2,"elements":[{"type":"iframe"}]}',
    ),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await elements()).toHaveLength(10);
  expect(errors).toEqual([]);
});

test("personal library persists after reload and across drawings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw?id=library-qa");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const bounds = await page.locator(".editor-surface").boundingBox();
  if (!bounds) throw new Error("Missing canvas");
  const y = bounds.y + 230;
  await page
    .getByRole("radio", { name: "Rectangle", exact: true })
    .check({ force: true });
  await page.mouse.move(450, y);
  await page.mouse.down();
  await page.mouse.move(600, y + 100);
  await page.mouse.up();
  await page.mouse.click(450, y + 50, { button: "right" });
  await page
    .getByRole("button", { name: "Add to library", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Library", exact: true })
    .check({ force: true });
  await expect(
    page.getByText("Personal Library", { exact: true }),
  ).toBeVisible();
  // Persistence is asynchronous; inspect its independent database before reopening.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open("indidraw-library", 1);
            open.onsuccess = () => {
              const request = open.result
                .transaction("library")
                .objectStore("library")
                .get("items");
              request.onsuccess = () => {
                resolve(request.result?.libraryItems?.length ?? 0);
                open.result.close();
              };
            };
          }),
      ),
    )
    .toBe(1);
  await expect(saved(page)).toBeVisible();
  for (const newBoard of [false, true]) {
    if (newBoard) await page.goto("/draw?id=another-library-qa");
    else await page.reload();
    const onboarding = page.getByRole("button", { name: "Let’s draw" });
    if (newBoard) await onboarding.click();
    await page
      .getByRole("checkbox", { name: "Library", exact: true })
      .check({ force: true });
    await expect(
      page.getByText("Personal Library", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".library-unit__active")).toHaveCount(1);
  }
});

test("local Mermaid conversion creates editable shapes and unsupported embeds are absent", async ({
  page,
}) => {
  await page.goto("/draw?id=mermaid-qa");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  await page.getByRole("button", { name: "More tools", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Web Embed", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Mermaid to Excalidraw", exact: true })
    .click();
  await page.locator("textarea").fill("flowchart LR\n A[Idea] --> B[Create]");
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  // Mermaid insertion enters placement mode. Place it on the canvas.
  await page.mouse.click(700, 400);
  const wait = page.waitForEvent("download");
  await exportAs(page, "excalidraw");
  const { readFile } = await import("node:fs/promises");
  const scene = JSON.parse(
    await readFile((await (await wait).path())!, "utf8"),
  ) as { elements: { text?: string; type: string }[] };
  expect(scene.elements.some((e) => e.text === "Idea")).toBe(true);
  expect(scene.elements.some((e) => e.type === "arrow")).toBe(true);
});

test("corrupted local drawings are preserved and a fresh canvas remains accessible", async ({
  page,
}) => {
  await page.goto("/draw?id=corruption-qa");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  await expect(saved(page)).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id")!;
  await page.evaluate(
    (id) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("indidraw", 1);
        open.onsuccess = () => {
          const tx = open.result.transaction("drawings", "readwrite");
          tx.objectStore("drawings").put({
            id,
            title: "Recover me",
            revision: 9999999999999,
            updatedAt: Date.now(),
            scene: "broken JSON",
          });
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    id,
  );
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Restore failed" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "has not been overwritten",
  );
  await fileMenu(page, "New drawing");
  await expect(page).not.toHaveURL(new RegExp(id));
  await expect(page.getByRole("button", { name: "Let’s draw" })).toBeVisible();
  const preserved = await page.evaluate(
    (id) =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open("indidraw", 1);
        open.onsuccess = () => {
          const get = open.result
            .transaction("drawings")
            .objectStore("drawings")
            .get(id);
          get.onsuccess = () => {
            resolve(get.result.scene);
            open.result.close();
          };
        };
      }),
    id,
  );
  expect(preserved).toBe("broken JSON");
});

test("resize, rotation, style, pan and zoom preserve drawing geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw?id=transform-qa");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const box = await page.locator(".editor-surface").boundingBox();
  if (!box) throw new Error("Missing editor");
  const x = 500,
    y = box.y + 250;
  await page
    .getByRole("radio", { name: "Rectangle", exact: true })
    .check({ force: true });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 150, y + 100);
  await page.mouse.up();
  await page.getByRole("button", { name: "#e03131", exact: true }).click();
  await page
    .getByRole("group", { name: "Stroke width", exact: true })
    .getByRole("radio")
    .nth(2)
    .check({ force: true });
  await page.mouse.move(x + 150, y + 100);
  await page.mouse.down();
  await page.mouse.move(x + 230, y + 140);
  await page.mouse.up();
  // The rotation handle is 16px above the selected shape.
  await page.mouse.move(x + 115, y - 16);
  await page.mouse.down();
  await page.mouse.move(x + 270, y + 60);
  await page.mouse.up();
  async function shape() {
    const wait = page.waitForEvent("download");
    await exportAs(page, "excalidraw");
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile((await (await wait).path())!, "utf8"))
      .elements[0] as {
      width: number;
      height: number;
      angle: number;
      x: number;
      y: number;
      strokeColor: string;
      strokeWidth: number;
    };
  }
  const transformed = await shape();
  expect(transformed.width).toBeGreaterThan(200);
  expect(transformed.height).toBeGreaterThan(120);
  expect(Math.abs(transformed.angle)).toBeGreaterThan(0.1);
  expect(transformed.strokeColor).toBe("#e03131");
  expect(transformed.strokeWidth).toBe(4);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reset zoom", exact: true }),
  ).not.toHaveText("100%");
  await page.getByRole("button", { name: "Reset zoom", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reset zoom", exact: true }),
  ).toHaveText("100%");
  await page
    .getByRole("radio", { name: /Hand \(panning tool\)/ })
    .check({ force: true });
  await page.mouse.move(950, y + 100);
  await page.mouse.down();
  await page.mouse.move(1050, y + 170);
  await page.mouse.up();
  expect(await shape()).toEqual(transformed);
});
