import { test, expect } from "@playwright/test";
import { exportAs, fileMenu } from "./helpers";
test("home, editable template, native backup, refresh and offline recovery", async ({
  page,
  context,
}) => {
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("requestfailed", (r) =>
    console.log("REQUEST FAILED", r.url(), r.failure()),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Every great idea/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Explore Templates/ }).click();
  await page.getByRole("link", { name: /Basic Flowchart/ }).click();
  await expect(page.locator(".excalidraw")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Drawing title" })
    .fill("My offline test");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await exportAs(page, "excalidraw");
  expect((await download).suggestedFilename()).toBe(
    "My offline test.excalidraw",
  );
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("My offline test");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Offline ready" }),
  ).toBeVisible({ timeout: 120000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("My offline test");
  await page
    .getByRole("textbox", { name: "Drawing title" })
    .fill("Edited offline");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("Edited offline");
  for (const format of ["png", "svg"]) {
    const wait = page.waitForEvent("download");
    await exportAs(page, format);
    expect((await wait).suggestedFilename()).toBe(`Edited offline.${format}`);
  }
});
test("gallery filtering and theme controls", async ({ page }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Education", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(4);
  await page.getByRole("button", { name: "In Hindi", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Education", exact: true }).click();
  await page.getByRole("searchbox").fill("Study");
  await expect(page.locator(".template-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("drawing tools, undo/redo, images, Unicode and native import/export round trip", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "showOpenFilePicker");
  });
  await page.goto("/draw?id=tools-test");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const surface = page.locator(".editor-surface");
  const bounds = await surface.boundingBox();
  if (!bounds) throw new Error("Missing editor");
  const y = bounds.y + 220;
  await page
    .getByRole("radio", { name: "Rectangle", exact: true })
    .check({ force: true });
  await page.mouse.move(350, y);
  await page.mouse.down();
  await page.mouse.move(560, y + 110);
  await page.mouse.up();
  await page
    .getByRole("radio", { name: "Draw", exact: true })
    .check({ force: true });
  await page.mouse.move(650, y);
  await page.mouse.down();
  for (let i = 0; i < 16; i++)
    await page.mouse.move(650 + i * 8, y + Math.sin(i / 3) * 35);
  await page.mouse.up();
  await page.keyboard.press("Meta+z");
  await page.keyboard.press("Meta+Shift+z");
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  await page.mouse.click(350, y + 190);
  await page.keyboard.insertText("नमस्ते भारत");
  await page.keyboard.press("Escape");
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("radio", { name: "Insert image", exact: true })
    .click({ force: true });
  await (
    await chooser
  ).setFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.mouse.click(800, y + 180);
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Drawing title" })
    .fill("Tool verification");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  const waitNative = page.waitForEvent("download");
  await exportAs(page, "excalidraw");
  const file = await waitNative;
  const path = await file.path();
  if (!path) throw new Error("Missing export");
  const { readFile } = await import("node:fs/promises");
  const native = JSON.parse(await readFile(path, "utf8"));
  expect(
    native.elements.some((e: { type: string }) => e.type === "rectangle"),
  ).toBe(true);
  expect(
    native.elements.some((e: { type: string }) => e.type === "freedraw"),
  ).toBe(true);
  expect(
    native.elements.some((e: { text?: string }) => e.text === "नमस्ते भारत"),
  ).toBe(true);
  expect(Object.keys(native.files).length).toBeGreaterThan(0);
  for (const format of ["png", "svg"]) {
    const wait = page.waitForEvent("download");
    await exportAs(page, format);
    const image = await wait;
    const imagePath = await image.path();
    expect((await readFile(imagePath!)).length).toBeGreaterThan(100);
    if (format === "svg")
      expect(await readFile(imagePath!, "utf8")).toContain(
        "data:font/woff2;base64,",
      );
  }
  await page.locator("input[type=file]").setInputFiles({
    name: "Round trip.excalidraw",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(native)),
  });
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("Round trip");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("Round trip");
});
test("all thirteen bundled templates open as editable saved drawings", async ({
  page,
}) => {
  for (const id of [
    "flowchart",
    "architecture",
    "mindmap",
    "organization",
    "timeline",
    "decision",
    "concept",
    "notes",
    "process",
    "brainstorm",
    "rainwater-hi",
    "lesson-plan-hi",
    "project-hi",
  ]) {
    await page.goto(`/draw?template=${id}`);
    await expect(page.locator(".excalidraw")).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Saved on this device" }),
    ).toBeVisible();
    const wait = page.waitForEvent("download");
    await exportAs(page, "excalidraw");
    const file = await wait;
    const path = await file.path();
    const { readFile } = await import("node:fs/promises");
    expect(
      JSON.parse(await readFile(path!, "utf8")).elements.length,
    ).toBeGreaterThan(0);
  }
});

test("save failures stay visible and editable backups remain available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<typeof original>
    ) {
      if (args[1] === "readwrite")
        throw new DOMException("Simulated quota failure", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page.goto("/draw?template=flowchart");
  await expect(
    page.getByRole("status").filter({ hasText: "Not saved" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Device storage is full");
  const url = page.url();
  await fileMenu(page, "New drawing");
  await expect(page).toHaveURL(url);
  const download = page.waitForEvent("download");
  await exportAs(page, "excalidraw");
  expect((await download).suggestedFilename()).toBe(
    "Basic Flowchart.excalidraw",
  );
});
