import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { exportAs } from "./helpers";
const textarea = 'textarea[data-type="wysiwyg"]';
async function start(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/draw");
  const welcome = page.getByRole("button", { name: "Let’s draw" });
  if (await welcome.isVisible()) await welcome.click();
  await page.locator(".typing-mode select").selectOption("hi-phonetic");
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  const surface = await page.locator(".editor-surface").boundingBox();
  await page.mouse.click(550, surface!.y + 250);
  await expect(page.locator(textarea)).toBeVisible();
}
async function download(page: Page, format: string) {
  const pending = page.waitForEvent("download");
  await exportAs(page, format);
  return readFile((await (await pending).path())!);
}
test("Hindi live typing, editing, native input, selection, history and paste", async ({
  page,
}) => {
  await start(page);
  const edit = page.locator(textarea);
  await page.keyboard.type("namaste bharat");
  await expect(edit).toHaveValue("नमस्ते भारत");
  await page.keyboard.press("Backspace");
  await expect(edit).toHaveValue("नमस्ते भर");
  await page.keyboard.type("t");
  await expect(edit).toHaveValue("नमस्ते भारत");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(edit).toHaveValue("नमस्ते भर");
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(edit).toHaveValue("नमस्ते भारत");
  // Cursor movement ends the pending Roman buffer. Selected Unicode is replaced
  // only by the newly typed word, while the rest of the text is retained.
  await page.keyboard.press("ArrowLeft");
  expect(
    await edit.evaluate((el) => (el as HTMLTextAreaElement).selectionStart),
  ).toBeLessThan("नमस्ते भारत".length);
  await edit.evaluate((el) => {
    (el as HTMLTextAreaElement).setSelectionRange(0, "नमस्ते".length);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await page.keyboard.type("hindi ");
  await expect(edit).toHaveValue(/हिंदी.*भारत/);
  await edit.evaluate((el) => {
    const target = el as HTMLTextAreaElement;
    target.setSelectionRange(target.value.length, target.value.length);
    document.dispatchEvent(new Event("selectionchange"));
  });
  // Paste events are deliberately not transliterated, even for Roman text.
  await edit.evaluate((el) => {
    const target = el as HTMLTextAreaElement;
    target.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        clipboardData: new DataTransfer(),
      }),
    );
    target.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        inputType: "insertFromPaste",
        data: " namaste हिन्दी",
      }),
    );
    target.setRangeText(
      " namaste हिन्दी",
      target.selectionStart,
      target.selectionEnd,
      "end",
    );
    target.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertFromPaste",
        data: " namaste हिन्दी",
      }),
    );
  });
  await expect(edit).toHaveValue(/namaste हिन्दी$/);
  // A native IME composition is never processed by the phonetic layer.
  await edit.evaluate((el) => {
    const target = el as HTMLTextAreaElement;
    target.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    target.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: " क्षि",
        isComposing: true,
      }),
    );
    target.setRangeText(
      " क्षि",
      target.selectionStart,
      target.selectionEnd,
      "end",
    );
    target.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: " क्षि",
        isComposing: true,
      }),
    );
    target.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: " क्षि" }),
    );
  });
  await expect(edit).toHaveValue(/namaste हिन्दी क्षि$/);
  await page.keyboard.press("Escape");
  const preserved = JSON.parse((await download(page, "excalidraw")).toString())
    .elements[0].text;
  for (const mode of ["english", "hi-native", "hi-phonetic"]) {
    await page.locator(".typing-mode select").selectOption(mode);
    expect(
      JSON.parse((await download(page, "excalidraw")).toString()).elements[0]
        .text,
    ).toBe(preserved);
  }
});

test("Hindi defaults automatically; Unicode saves, reopens and exports offline", async ({
  page,
  context,
}) => {
  await start(page);
  await page.keyboard.type("namaste bharat shiksha kripya main hoon");
  const expected = "नमस्ते भारत शिक्षा कृपया मैं हूँ";
  await expect(page.locator(textarea)).toHaveValue(expected);
  await page.keyboard.press("Escape");
  await expect(page.locator(".save-status")).toContainText(
    "Saved on this device",
  );
  const native = await download(page, "excalidraw");
  expect(JSON.parse(native.toString()).elements[0].text).toBe(expected);
  await page.locator(".language-selector select").selectOption("hi");
  await expect(page.locator(".typing-mode select")).toHaveValue("hi-phonetic");
  expect(
    JSON.parse((await download(page, "excalidraw")).toString()).elements[0]
      .text,
  ).toBe(expected);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".typing-mode select")).toHaveValue("hi-phonetic");
  const svg = (await download(page, "svg")).toString();
  expect(svg).toContain(expected);
  expect(svg).toContain("data:font/woff2;base64,");
  const png = await download(page, "png");
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  // Reopen native JSON using the existing importer, with no online request.
  await page.locator("input[type=file]").setInputFiles({
    name: "Hindi.excalidraw",
    mimeType: "application/json",
    buffer: native,
  });
  expect(
    JSON.parse((await download(page, "excalidraw")).toString()).elements[0]
      .text,
  ).toBe(expected);
});

test("English and native keyboard modes leave typed text alone", async ({
  page,
}) => {
  await start(page);
  const edit = page.locator(textarea);
  // Controls live above the canvas; Escape finishes an edit before switching.
  await page.keyboard.press("Escape");
  for (const mode of ["english", "hi-native"]) {
    await page.locator(".typing-mode select").selectOption(mode);
    await page
      .getByRole("radio", { name: "Text", exact: true })
      .check({ force: true });
    const box = await page.locator(".editor-surface").boundingBox();
    await page.mouse.click(550, box!.y + (mode === "english" ? 220 : 400));
    await page.keyboard.type("namaste bharat ");
    await page.keyboard.insertText("नमस्ते भारत");
    await expect(edit).toHaveValue("namaste bharat नमस्ते भारत");
    await page.keyboard.press("Escape");
  }
});

test("candidate choice, Unicode copy/paste and offline new typing", async ({
  page,
  context,
}) => {
  await start(page);
  const edit = page.locator(textarea);
  await page.keyboard.type("bharat");
  await page.getByRole("button", { name: "भरत", exact: true }).click();
  await expect(edit).toHaveValue("भरत");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(edit).toHaveValue("भारत");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+c");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type(" ");
  await page.keyboard.press("ControlOrMeta+v");
  await expect(edit).toHaveValue("भारत भारत");
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  const box = await page.locator(".editor-surface").boundingBox();
  await page.mouse.click(550, box!.y + 450);
  await page.keyboard.type("namaste");
  await expect(edit).toHaveValue("नमस्ते");
  await page.keyboard.press("Escape");
  // Canvas-level undo/redo remains Excalidraw's responsibility after submission.
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  let scene = JSON.parse((await download(page, "excalidraw")).toString());
  expect(
    scene.elements
      .filter((e: { isDeleted: boolean }) => !e.isDeleted)
      .map((e: { text: string }) => e.text),
  ).not.toContain("नमस्ते");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  scene = JSON.parse((await download(page, "excalidraw")).toString());
  expect(scene.elements.map((e: { text: string }) => e.text)).toContain(
    "नमस्ते",
  );
});

test("choosing Hindi never converts existing English text", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.press("Escape");
  await page.locator(".typing-mode select").selectOption("english");
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  const box = await page.locator(".editor-surface").boundingBox();
  await page.mouse.click(550, box!.y + 250);
  await page.keyboard.type("namaste bharat");
  await expect(page.locator(textarea)).toHaveValue("namaste bharat");
  await page.keyboard.press("Escape");
  await page.locator(".language-selector select").selectOption("hi");
  await expect(page.locator(".typing-mode select")).toHaveValue("hi-phonetic");
  const scene = JSON.parse((await download(page, "excalidraw")).toString());
  expect(scene.elements[0].text).toBe("namaste bharat");
});
