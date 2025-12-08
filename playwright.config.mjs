import { defineConfig } from "@playwright/test";

import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  testDir: "./tests/generated",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "reports/test-results.json" }],
    ["html", { outputFolder: "reports/html" }],
  ],
  use: {
    baseURL:
      process.env.STUDENT_URL || "https://canvas-web-dev.vercel.app/Labs",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
});
