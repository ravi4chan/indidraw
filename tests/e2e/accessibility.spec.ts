import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("custom pages have no automated WCAG AA violations", async ({ page }) => {
  for (const route of ["/", "/templates", "/about", "/privacy"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
test("dark pages have no automated WCAG AA violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  for (const route of ["/", "/templates", "/about", "/privacy"]) {
    if (route !== "/") await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
test("desktop and tablet layouts fit their viewport", async ({
  page,
}, testInfo) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Every great idea/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (testInfo.project.name === "chromium" && width === 1440) {
      await page.screenshot({
        path: "../indidraw-homepage.png",
        fullPage: true,
      });
      await page.screenshot({ path: "../indidraw-preview.png" });
    }
  }
});
