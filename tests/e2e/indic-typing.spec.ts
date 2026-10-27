import { test, expect } from "@playwright/test";
import { transliterators } from "../../src/editor/transliteration/indic";

const textarea = 'textarea[data-type="wysiwyg"]';
// Two real words per language, typed in English letters.
const cases = [
  ["hi", "namaste", "bharat"],
  ["te", "telugu", "nenu"],
  ["bn", "ami", "bhalo"],
  ["ta", "vanakkam", "tamizh"],
  ["mr", "ghar", "paani"],
  ["ml", "malayalam", "avan"],
] as const;

for (const [code, first, second] of cases) {
  const engine = transliterators[code];
  const word = (roman: string) => engine.candidates(roman)[0];
  test(`${code}: choosing the language types its script on the canvas`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/draw");
    const welcome = page.getByRole("button", { name: "Let’s draw" });
    if (await welcome.isVisible()) await welcome.click();
    await page.locator(".language-selector select").selectOption(code);
    await page.waitForLoadState("load");
    await expect(page.locator(".language-selector select")).toHaveValue(code);
    // The keyboard follows the interface language.
    await expect(page.locator(".typing-mode select")).toHaveValue(
      `${code}-phonetic`,
    );
    // Close the welcome card in whatever language it is shown.
    const welcomeCard = page.locator(".onboarding .button");
    await welcomeCard
      .click({ timeout: 3000 })
      .catch(() => undefined /* Already closed. */);
    await page.locator('[data-testid="toolbar-text"]').click({ force: true });
    const surface = await page.locator(".editor-surface").boundingBox();
    await page.mouse.click(550, surface!.y + 250);
    const edit = page.locator(textarea);
    await expect(edit).toBeVisible();
    // Screen readers and font fallback see the right language.
    expect(
      await edit.evaluate((el) => el.closest("[lang]")?.getAttribute("lang")),
    ).toBe(code);

    await page.keyboard.type(`${first} ${second}`);
    await expect(edit).toHaveValue(`${word(first)} ${word(second)}`);
    // Backspace removes one typed letter and re-spells the word.
    await page.keyboard.press("Backspace");
    await expect(edit).toHaveValue(
      `${word(first)} ${word(second.slice(0, -1))}`,
    );
    await page.keyboard.type(second.slice(-1));
    await expect(edit).toHaveValue(`${word(first)} ${word(second)}`);
    await page.keyboard.press("ControlOrMeta+z");
    await expect(edit).toHaveValue(
      `${word(first)} ${word(second.slice(0, -1))}`,
    );

    // The choice survives a reload.
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.locator(".language-selector select")).toHaveValue(code);
    await expect(page.locator(".typing-mode select")).toHaveValue(
      `${code}-phonetic`,
    );
  });
}
