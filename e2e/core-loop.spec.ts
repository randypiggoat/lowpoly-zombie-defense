import { test, expect } from "@playwright/test";

test("new player can enter gameplay from the main menu", async ({ page }) => {
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

  await expect(page.getByText("Modes", { exact: true })).toBeVisible();
  await expect(page.getByText("Progress", { exact: true })).toBeVisible();
  await expect(page.getByText("Last defense network", { exact: true })).toBeVisible();
  await expect(page.locator(".rotwood-shell")).toHaveCount(1);
  await expect(page.getByText("Daily supply drop", { exact: true })).toBeVisible();
  await expect(page.getByText(/DAY \d+\/7/)).toBeVisible();
  await expect(page.getByRole("button", { name: "CLAIM" })).toBeVisible();

  const playButton = page.getByRole("button", { name: "DEFEND NOW" });
  await expect(playButton).toBeVisible();

  await playButton.click();

  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByText("BUILD YOUR FIRST TOWER", { exact: true })).toBeVisible();

  const renderCheck = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return { supported: false, unique: 0, nonSky: 0 };
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixel = new Uint8Array(4);
    const samples = new Set<string>();
    let nonSky = 0;
    const sky = "143,196,216";
    for (const px of [0.15, 0.35, 0.5, 0.65, 0.85]) {
      for (const py of [0.2, 0.4, 0.6, 0.8]) {
        gl.readPixels(Math.floor(width * px), Math.floor(height * py), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
        samples.add(key);
        if (key !== sky) nonSky += 1;
      }
    }
    return { supported: true, unique: samples.size, nonSky };
  });

  expect(renderCheck.supported).toBe(true);
  expect(renderCheck.nonSky).toBeGreaterThan(2);
  expect(renderCheck.unique).toBeGreaterThan(2);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});


test("weekly boss trials have a distinct entry screen", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Boss Trials" }).click();

  await expect(page.getByText("Boss Trials", { exact: true })).toBeVisible();
  await expect(page.getByText("Weekly rotation", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ENTER TRIAL" })).toBeVisible();
  await expect(page.getByText(/This week/)).toBeVisible();
});
