import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:7123",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "mobile-safari-mini",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev --port 7123",
        url: "http://localhost:7123",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
