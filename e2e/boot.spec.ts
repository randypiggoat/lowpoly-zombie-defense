import { test, expect } from "@playwright/test";

test("game boots successfully", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  const canvas = page.locator("canvas");

  await expect(canvas).toHaveCount(1, { timeout: 15000 });

  await expect
    .poll(
      async () => {
        return await canvas.evaluate((element) => {
          const rect = element.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0;
        });
      },
      {
        timeout: 15000,
        message: "The game canvas should become larger than 0x0.",
      },
    )
    .toBe(true);

  const canvasSize = await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      width: rect.width,
      height: rect.height,
    };
  });

  expect(canvasSize.width).toBeGreaterThan(0);
  expect(canvasSize.height).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});