import type { Page } from "@playwright/test";

/** Downloads a copy through the File menu, in any interface language. */
export async function exportAs(page: Page, format: string) {
  await page.locator(".file-menu > button").click();
  await page.locator(`[data-export="${format}"]`).click();
  // Untitled drawings ask for a name once; keep the default and continue.
  const prompt = page.locator(".name-prompt");
  try {
    await prompt.waitFor({ state: "visible", timeout: 750 });
    await prompt.locator('button[type="submit"]').click();
  } catch {
    /* Named drawings download straight away. */
  }
}

/** Opens the File menu and chooses an item by its English label. */
export async function fileMenu(page: Page, label: string) {
  await page.locator(".file-menu > button").click();
  await page.getByRole("menuitem", { name: label }).click();
}
