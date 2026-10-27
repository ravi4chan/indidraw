import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { exportAs } from "./helpers";
const fonts = [
  [201, "Hindi Noto Sans Devanagari", "नमस्ते भारत"],
  [202, "Telugu Noto Sans Telugu", "తెలుగు భాష"],
  [203, "Bengali Noto Sans Bengali", "বাংলা ভাষা"],
  [204, "Tamil Noto Sans Tamil", "தமிழ் மொழி"],
  [205, "Marathi Noto Serif Devanagari", "मराठी भाषा"],
] as const;
test("five language fonts are selectable, saved, imported and exported offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/draw?id=font-choices-qa");
  await page.getByRole("button", { name: "Let’s draw" }).click();
  const box = await page.locator(".editor-surface").boundingBox();
  if (!box) throw new Error("No canvas");
  for (const [i, [, name, text]] of fonts.entries()) {
    await page
      .getByRole("radio", { name: "Selection", exact: true })
      .check({ force: true });
    await page.mouse.click(1100, box.y + 150);
    await page
      .getByRole("radio", { name: "Text", exact: true })
      .check({ force: true });
    await page
      .getByRole("button", { name: "Show font picker", exact: true })
      .click();
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(name) }),
    ).toBeHidden();
    await page.mouse.click(430, box.y + 180 + i * 120);
    await expect(page.locator('textarea[data-type="wysiwyg"]')).toBeVisible();
    await page.keyboard.insertText(text);
    await page.keyboard.press("Escape");
    await expect(page.locator('textarea[data-type="wysiwyg"]')).toBeHidden();
  }
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  async function exported(format: string) {
    const wait = page.waitForEvent("download", { timeout: 60000 });
    await exportAs(page, format);
    return await readFile((await (await wait).path())!);
  }
  const native = await exported("excalidraw");
  const scene = JSON.parse(native.toString()) as {
    elements: { fontFamily: number; text: string }[];
  };
  for (const [id, , text] of fonts)
    expect(
      scene.elements.some((e) => e.fontFamily === id && e.text === text),
    ).toBe(true);
  await page.reload();
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  expect(
    JSON.parse((await exported("excalidraw")).toString()).elements.map(
      (e: { fontFamily: number }) => e.fontFamily,
    ),
  ).toEqual(fonts.map((f) => f[0]));
  await page.locator("input[type=file]").setInputFiles({
    name: "Five language fonts.excalidraw",
    mimeType: "application/json",
    buffer: native,
  });
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("Five language fonts");
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  const svg = (await exported("svg")).toString();
  for (const [, name, text] of fonts) {
    expect(svg).toContain(name);
    expect(svg).toContain(text);
  }
  expect(svg).toContain("data:font/woff2;base64,");
  const png = await exported("png");
  expect(png.readUInt32BE(16)).toBeGreaterThan(100);
  if (test.info().project.name === "chromium")
    await writeFile("../indidraw-five-language-fonts.png", png);
  expect(errors).toEqual([]);
});

test("reviewed terminology appears in header and text settings in all five languages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw?template=flowchart");
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  for (const [
    code,
    importLabel,
    ,
    fontLabel,
    size,
    align,
    stroke,
    opacity,
    layers,
  ] of [
    [
      "hi",
      "इंपोर्ट",
      "एक्सपोर्ट",
      "फ़ॉन्ट",
      "फ़ॉन्ट साइज़",
      "टेक्स्ट अलाइनमेंट",
      "स्ट्रोक",
      "ओपैसिटी",
      "लेयर्स",
    ],
    [
      "te",
      "ఇంపోర్ట్",
      "ఎక్స్‌పోర్ట్",
      "ఫాంట్",
      "ఫాంట్ సైజు",
      "టెక్స్ట్ అలైన్‌మెంట్",
      "స్ట్రోక్",
      "ఒపాసిటీ",
      "లేయర్లు",
    ],
    [
      "bn",
      "ইমপোর্ট",
      "এক্সপোর্ট",
      "ফন্ট",
      "ফন্টের আকার",
      "টেক্সট অ্যালাইনমেন্ট",
      "স্ট্রোক",
      "অপাসিটি",
      "লেয়ার",
    ],
    [
      "ta",
      "இம்போர்ட்",
      "எக்ஸ்போர்ட்",
      "எழுத்துரு",
      "எழுத்துரு அளவு",
      "உரை சீரமைப்பு",
      "ஸ்ட்ரோக்",
      "ஒபாசிட்டி",
      "லேயர்கள்",
    ],
    [
      "mr",
      "इम्पोर्ट",
      "एक्सपोर्ट",
      "फॉन्ट",
      "फॉन्ट आकार",
      "मजकूर मांडणी",
      "स्ट्रोक",
      "ऑपॅसिटी",
      "लेयर्स",
    ],
  ]) {
    await page.locator(".language-selector select").selectOption(code);
    // Document actions now live in the translated File menu.
    await page.locator(".file-menu > button").click();
    await expect(page.getByRole("menu")).toContainText(importLabel);
    await page.keyboard.press("Escape");
    await page.locator(".excalidraw").click({ position: { x: 1000, y: 650 } });
    await page.keyboard.press("t");
    for (const label of [fontLabel, size, align, stroke, layers])
      await expect(
        page.locator(".excalidraw").getByText(label, { exact: true }).first(),
      ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: new RegExp(opacity) }),
    ).toBeVisible();
  }
});
