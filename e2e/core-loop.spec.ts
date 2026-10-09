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

  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await expect(page.getByRole("heading", { name: /ROTWOOD.*DEFENSE/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /THE LAST LIGHT/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Operations/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Armory/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Field Intel/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Supply Depot/i })).toBeVisible();

  const playButton = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
  await expect(playButton).toBeVisible();

  await playButton.click();

  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByText("BUILD YOUR FIRST TOWER", { exact: true })).toBeVisible();

  const canvasPng = await page.locator("canvas").screenshot({ type: "png" });
  const renderCheck = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const scratch = document.createElement("canvas");
    scratch.width = image.naturalWidth;
    scratch.height = image.naturalHeight;
    const context = scratch.getContext("2d", { willReadFrequently: true });
    if (!context) return { supported: false, unique: 0 };

    context.drawImage(image, 0, 0);
    const samples = new Set<string>();
    const sampleX = [0.15, 0.35, 0.5, 0.65, 0.85];
    const sampleY = [0.2, 0.4, 0.6, 0.8];
    for (const px of sampleX) {
      for (const py of sampleY) {
        const x = Math.min(scratch.width - 1, Math.floor(scratch.width * px));
        const y = Math.min(scratch.height - 1, Math.floor(scratch.height * py));
        const pixel = context.getImageData(x, y, 1, 1).data;
        samples.add(`${pixel[0]},${pixel[1]},${pixel[2]}`);
      }
    }

    return { supported: true, unique: samples.size };
  }, Buffer.from(canvasPng).toString("base64"));

  expect(renderCheck.supported).toBe(true);
  expect(renderCheck.unique).toBeGreaterThan(2);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});


test("weekly boss trials have a distinct entry screen", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Operations/i }).click();
  await page.getByRole("button", { name: /Boss Trials/i }).click();

  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "boss-trial-select");
  await expect(page.getByRole("button", { name: "ENTER TRIAL" })).toBeVisible();
  await expect(page.getByText("Weekly rotation", { exact: true })).toBeVisible();
  await expect(page.getByText(/This week/)).toBeVisible();
});
