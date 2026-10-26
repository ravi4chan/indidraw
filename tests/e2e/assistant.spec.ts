import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { exportAs } from "./helpers";
async function start(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw");
  const welcome = page.getByRole("button", { name: "Let’s draw" });
  if (await welcome.isVisible()) await welcome.click();
  await page
    .getByRole("button", { name: "Diagram assistant", exact: true })
    .click();
}
async function scene(page: Page) {
  const promise = page.waitForEvent("download");
  await exportAs(page, "excalidraw");
  return JSON.parse(await readFile((await (await promise).path())!, "utf8"));
}
async function command(page: Page, input: string) {
  await page.getByRole("textbox", { name: "Build a diagram" }).fill(input);
  await page.getByRole("button", { name: "Preview changes" }).click();
  await page.getByRole("button", { name: "Apply to canvas" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Added to your drawing" }),
  ).toBeVisible();
}
test("native editable graph, preview, bindings, atomic undo, rename, persistence and exports", async ({
  page,
}) => {
  await start(page);
  await expect(page.getByText("Voice is not connected yet")).toBeVisible();
  await page.getByRole("button", { name: "Rainwater harvesting" }).click();
  await page.getByRole("button", { name: "Preview changes" }).click();
  expect((await scene(page)).elements).toHaveLength(0);
  await page.getByRole("button", { name: "Apply to canvas" }).click();
  let data = await scene(page);
  expect(
    data.elements.filter((e: { type: string }) => e.type === "rectangle"),
  ).toHaveLength(4);
  const arrows = data.elements.filter(
    (e: { type: string }) => e.type === "arrow",
  );
  expect(arrows).toHaveLength(3);
  for (const arrow of arrows) {
    expect(arrow.startBinding?.elementId).toBeTruthy();
    expect(arrow.endBinding?.elementId).toBeTruthy();
    expect(
      data.elements.find(
        (e: { id: string }) => e.id === arrow.startBinding.elementId,
      ).boundElements,
    ).toContainEqual({ type: "arrow", id: arrow.id });
  }
  const original = data.elements.find(
    (e: { originalText: string }) => e.originalText === "Roof",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(
    (await scene(page)).elements.filter(
      (e: { isDeleted: boolean }) => !e.isDeleted,
    ),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await command(page, 'rename "Roof" to "छत"');
  data = await scene(page);
  expect(
    data.elements.find((e: { id: string }) => e.id === original.id)
      .originalText,
  ).toBe("छत");
  await page.screenshot({
    path: `test-results/assistant-${test.info().project.name}.png`,
  });
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  await page.reload();
  expect(
    (await scene(page)).elements.find(
      (e: { id: string }) => e.id === original.id,
    ).originalText,
  ).toBe("छत");
  const svgDownload = page.waitForEvent("download");
  await exportAs(page, "svg");
  const svg = await readFile((await (await svgDownload).path())!, "utf8");
  expect(svg).toContain("छत");
  const pngDownload = page.waitForEvent("download");
  await exportAs(page, "png");
  const png = await readFile((await (await pngDownload).path())!);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});

test("manual canvas edits invalidate stale previews and survive later commands", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("textbox", { name: "Build a diagram" })
    .fill('box "Assistant"');
  await page.getByRole("button", { name: "Preview changes" }).click();
  await page
    .getByRole("radio", { name: "Rectangle", exact: true })
    .check({ force: true });
  const bounds = await page.locator(".editor-surface").boundingBox();
  await page.mouse.move(bounds!.x + 240, bounds!.y + 300);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 360, bounds!.y + 410);
  await page.mouse.up();
  const handDrawn = (await scene(page)).elements.find(
    (e: { type: string }) => e.type === "rectangle",
  );
  expect(handDrawn).toBeTruthy();
  await page.getByRole("button", { name: "Apply to canvas" }).click();
  await expect(page.getByRole("alert")).toContainText("canvas changed");
  expect(
    (await scene(page)).elements.filter(
      (e: { type: string }) => e.type === "rectangle",
    ),
  ).toHaveLength(1);
  await command(page, 'box "Assistant"');
  const result = (await scene(page)).elements;
  expect(
    result.find((e: { id: string }) => e.id === handDrawn.id),
  ).toMatchObject({
    x: handDrawn.x,
    y: handDrawn.y,
    width: handDrawn.width,
    height: handDrawn.height,
  });
  expect(
    result.filter((e: { type: string }) => e.type === "rectangle"),
  ).toHaveLength(2);
});

test("assistant is accessible in both themes and returns keyboard focus on close", async ({
  page,
}) => {
  await start(page);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Use dark theme" }).click();
    const result = await new AxeBuilder({ page })
      .include(".diagram-assistant")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.screenshot({
    path: `test-results/assistant-dark-${test.info().project.name}.png`,
  });
  await page.getByRole("textbox", { name: "Build a diagram" }).focus();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Diagram assistant", exact: true }),
  ).toBeFocused();
});
test("unsupported instructions do not partially change drawings; assistant works offline and closes on mobile", async ({
  page,
  context,
}) => {
  await start(page);
  await command(page, 'box "Existing"');
  const before = (await scene(page)).elements;
  await page
    .getByRole("textbox", { name: "Build a diagram" })
    .fill('box "Should not appear"\nconnect "Missing" → "Existing"');
  await page.getByRole("button", { name: "Preview changes" }).click();
  await expect(page.getByRole("alert")).toContainText("Create it first");
  expect((await scene(page)).elements).toEqual(before);
  await context.setOffline(true);
  await command(page, 'ellipse "Offline"\nconnect "Existing" → "Offline"');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("textbox", { name: "Build a diagram" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close diagram assistant" }).click();
  await expect(
    page.getByRole("complementary", { name: "Diagram assistant" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Typing mode" }),
  ).toBeVisible();
});
