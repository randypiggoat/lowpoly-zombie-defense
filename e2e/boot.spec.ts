import { test, expect } from "@playwright/test";

test("game boots successfully", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // Ignore the known React 19 + R3F/Drei development renderer warning; page
    // exceptions remain fatal through the pageerror handler.
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
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

  await expect.poll(async () => canvas.getAttribute("data-camera-profile")).toBeTruthy();
  const renderMetrics = await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      pixelRatio: Number(element.dataset.renderPixelRatio),
      cssWidth: rect.width,
      cssHeight: rect.height,
      drawingBufferWidth: element.width,
      drawingBufferHeight: element.height,
      cameraProfile: element.dataset.cameraProfile,
      cameraFov: Number(element.dataset.cameraFov),
    };
  });
  expect(renderMetrics.pixelRatio).toBeGreaterThanOrEqual(1);
  expect(renderMetrics.drawingBufferWidth).toBeGreaterThanOrEqual(Math.floor(renderMetrics.cssWidth));
  expect(renderMetrics.drawingBufferHeight).toBeGreaterThanOrEqual(Math.floor(renderMetrics.cssHeight));
  expect(renderMetrics.cameraFov).toBeGreaterThan(0);
  const expectedCameraProfile = await page.evaluate(() => {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    if (aspect < 1 / 1.4) return "portrait";
    if (aspect < 1.35) return "compact-landscape";
    if (aspect >= 1.9) return "wide-landscape";
    return "landscape";
  });
  expect(renderMetrics.cameraProfile).toBe(expectedCameraProfile);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});