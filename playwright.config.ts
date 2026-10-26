import { defineConfig, devices } from "@playwright/test";
const headers = process.env.INDIDRAW_CSP_TEST === "1";
const url = `http://127.0.0.1:${headers ? 4180 : 4173}`;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  use: {
    actionTimeout: 15000,
    baseURL: url,
    trace: "retain-on-failure",
  },
  webServer: {
    command: headers
      ? "node tests/serve-production.mjs"
      : "pnpm preview --port 4173",
    url,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
