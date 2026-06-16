import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost";

export default defineConfig({
  testDir: "./tests",
  // The editor route loads Fabric.js + Yjs and, on the dev server, compiles on
  // first hit; the first editor interaction can legitimately take a while in CI
  // even after route warm-up. Give the suite headroom so a slow-but-correct load
  // is not reported as a failure.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
