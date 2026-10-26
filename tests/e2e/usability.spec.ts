import { test, expect, type Page } from "@playwright/test";
import { exportAs } from "./helpers";
const textarea = 'textarea[data-type="wysiwyg"]';
async function open(page: Page, path = "/draw") {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(path);
  const welcome = page.getByRole("button", { name: "Let’s draw" });
  if (await welcome.isVisible()) await welcome.click();
  await expect(page.locator(".excalidraw")).toBeVisible();
}

test("File menu works from the keyboard and closes with Escape", async ({
  page,
}) => {
  await open(page);
  const file = page.locator(".file-menu > button");
  await file.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Open saved drawing…" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(file).toBeFocused();
});

test("exporting an untitled drawing asks for a name once", async ({ page }) => {
  await open(page);
  await page.locator(".file-menu > button").click();
  await page.locator('[data-export="excalidraw"]').click();
  const prompt = page.getByRole("dialog", { name: "Name your drawing" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("textbox").fill("Science project");
  const download = page.waitForEvent("download");
  await prompt.getByRole("button", { name: "Save name and download" }).click();
  expect((await download).suggestedFilename()).toBe(
    "Science project.excalidraw",
  );
  await expect(
    page.getByRole("textbox", { name: "Drawing title" }),
  ).toHaveValue("Science project");
  await expect(
    page.getByRole("status").filter({ hasText: "Backup saved" }),
  ).toBeVisible();
});

test("Hindi choices float by the text and number keys pick one", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("combobox", { name: "Typing mode" })
    .selectOption("hi-phonetic");
  await page
    .getByRole("radio", { name: "Text", exact: true })
    .check({ force: true });
  const surface = await page.locator(".editor-surface").boundingBox();
  await page.mouse.click(550, surface!.y + 250);
  await page.keyboard.type("Bharat");
  const edit = page.locator(textarea);
  await expect(edit).toHaveValue("भारत");
  const choices = page.getByRole("group", { name: "Hindi spelling choices" });
  await expect(choices).toBeVisible();
  // The popup sits just under the text box, not in a toolbar.
  const [box, popup] = [await edit.boundingBox(), await choices.boundingBox()];
  expect(popup!.y).toBeGreaterThan(box!.y);
  expect(popup!.y - (box!.y + box!.height)).toBeLessThan(40);
  await page.keyboard.press("2");
  await expect(edit).toHaveValue("भरत");
  await expect(choices).toHaveCount(0);
});

test("assistant shows an outline before applying and can undo its change", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Diagram assistant", exact: true })
    .click();
  await page.getByRole("button", { name: 'box "Student"' }).click();
  await expect(
    page.getByRole("textbox", { name: "Build a diagram" }),
  ).toHaveValue('box "Student"');
  await page.getByRole("button", { name: "Preview changes" }).click();
  await expect(page.locator(".assistant-ghost rect")).toHaveCount(1);
  await page.getByRole("button", { name: "Apply to canvas" }).click();
  await expect(page.locator(".assistant-ghost")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Added to your drawing" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo assistant change" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Removed from your drawing" }),
  ).toBeVisible();
  const data = await (async () => {
    const wait = page.waitForEvent("download");
    await exportAs(page, "excalidraw");
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile((await (await wait).path())!, "utf8"));
  })();
  expect(
    data.elements.filter((e: { isDeleted: boolean }) => !e.isDeleted),
  ).toHaveLength(0);
});

test("home page switches language and carries it into the editor", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".site-header")
    .getByRole("combobox", { name: "Language" })
    .selectOption("hi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "हर बड़ा विचार",
  );
  await expect(page.locator("#languages")).toContainText("अपनी भाषा में");
  await page.goto("/draw");
  await expect(
    page.getByRole("combobox", { name: "Language", exact: true }),
  ).toHaveValue("hi");
  await expect(page.getByRole("combobox", { name: "Typing mode" })).toHaveValue(
    "hi-phonetic",
  );
});
