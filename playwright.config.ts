import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 0,

  workers: 1,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: "http://127.0.0.1:4173",

    screenshot: "only-on-failure",

    trace: "retain-on-failure",

    video: "retain-on-failure",

    actionTimeout: 10000,

    navigationTimeout: 30000,
  },

  webServer: {
    command: "bun run dev -- --host 127.0.0.1 --port 4173",

    url: "http://127.0.0.1:4173",

    reuseExistingServer: !process.env.CI,

    timeout: 120000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI
          ? {
              launchOptions: {
                args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
              },
            }
          : {}),
      },
    },

    {
      name: "iphone",
      use: {
        ...devices["iPhone 15"],
      },
    },
  ],
});