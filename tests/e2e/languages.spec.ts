import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { exportAs } from "./helpers";
// Each language labels the File menu button in its own script.
const options = [
  ["en", "File"],
  ["hi", "फ़ाइल"],
  ["te", "ఫైల్"],
  ["bn", "ফাইল"],
  ["ta", "கோப்பு"],
  ["mr", "फाइल"],
  ["ml", "ഫയൽ"],
] as const;
test("language choices preserve the document, persist and work offline", async ({
  page,
  context,
}, testInfo) => {
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log("BROWSER ERROR", message.text());
  });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto("/draw?template=flowchart");
  const selector = page.locator(".language-selector select");
  await expect(selector).toHaveValue("en");
  await expect(selector.locator("option")).toHaveCount(7);
  await expect(page.locator(".excalidraw")).toBeVisible();
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  const title = page.locator(".document-name");
  await title.fill("My first IndiDraw book");
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  const exportScene = async () => {
    const wait = page.waitForEvent("download");
    await exportAs(page, "excalidraw");
    const file = await wait;
    return JSON.parse(await readFile((await file.path())!, "utf8"));
  };
  const before = await exportScene();
  for (const [locale, label] of options) {
    await page.waitForURL(/\/draw\?id=/);
    if ((await selector.inputValue()) !== locale) {
      await selector.selectOption(locale);
      await page.waitForLoadState("load");
    }
    await expect(selector).toHaveValue(locale);
    await expect(page.locator(".excalidraw")).toBeVisible();
    await expect(page.locator(".file-menu > button")).toHaveText(label);
    await expect(title).toHaveValue("My first IndiDraw book");
    const rectangleLabels = {
      en: "Rectangle",
      hi: "आयत",
      te: "దీర్ఘచతురస్రం",
      bn: "আয়তক্ষেত্র",
      ta: "செவ்வகம்",
      mr: "आयत",
      ml: "ദീർഘചതുരം",
    };
    await expect(
      page.getByRole("radio", { name: rectangleLabels[locale], exact: true }),
    ).toBeAttached({ timeout: 15000 });
    const scene = await exportScene();
    expect(scene.elements.map((e: { id: string }) => e.id)).toEqual(
      before.elements.map((e: { id: string }) => e.id),
    );
  }
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await title.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await selector.selectOption("te");
  await expect(page.locator(".file-menu > button")).toHaveText("ఫైల్");
  await page.reload();
  await expect(selector).toHaveValue("te");
  await expect(title).toHaveValue("My first IndiDraw book");
  await expect(page.locator(".editor-bottom [role=status]")).toContainText(
    "ఆఫ్‌లైన్‌కు సిద్ధం",
    { timeout: 120000 },
  );
  await context.setOffline(true);
  await page.reload();
  await selector.selectOption("bn");
  await expect(selector).toHaveValue("bn");
  await expect(page.locator(".file-menu > button")).toHaveText("ফাইল");
  await expect(title).toHaveValue("My first IndiDraw book");
  await context.setOffline(false);
  await selector.selectOption("hi");
  await expect(selector).toHaveValue("hi");
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.reload();
  await expect(page.locator(".excalidraw")).toBeVisible();
  await expect(page.locator(".save-status")).toContainText(
    "इस डिवाइस पर सहेजा गया",
  );
  if (testInfo.project.name === "chromium")
    await page.screenshot({ path: "../indidraw-language-menu.png" });
});
test("Indic scripts keep Unicode content and embedded SVG fonts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto("/draw?id=indic-export");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const bounds = await page.locator(".editor-surface").boundingBox();
  if (!bounds) throw new Error("No canvas");
  const text = "नमस्ते भारत · తెలుగు · বাংলা · தமிழ் · मराठी";
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  await page.mouse.click(300, bounds.y + 200);
  await page.keyboard.insertText(text);
  await page.keyboard.press("Escape");
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  for (const format of ["excalidraw", "svg", "png"]) {
    const wait = page.waitForEvent("download");
    await exportAs(page, format);
    const file = await wait;
    const bytes = await readFile((await file.path())!);
    expect(bytes.length).toBeGreaterThan(100);
    if (format === "excalidraw")
      expect(
        JSON.parse(bytes.toString()).elements.some(
          (e: { text?: string }) => e.text === text,
        ),
      ).toBe(true);
    if (format === "svg") {
      const svg = bytes.toString();
      expect(svg).toContain("U+0C00-0C7F");
      expect(svg).toContain("U+0980-09FF");
      expect(svg).toContain("U+0B80-0BFF");
      expect(svg).toContain("U+0900-097F");
    }
  }
});
