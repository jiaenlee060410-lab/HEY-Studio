import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 240000,
  expect: { timeout: 20000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 760, height: 480 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-angle=swiftshader",
      ],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
