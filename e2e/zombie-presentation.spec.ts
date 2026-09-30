import { test, expect } from "@playwright/test";

test("late campaign zombie presentation survives a crowded mobile gameplay view", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
  });

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: "Campaign" }).click();
  const stage20 = page.locator('[data-stage-id="20"]');
  await expect(stage20).toHaveCount(1);

  // QA builds expose the campaign cards without changing the shipping menu.
  const stageButton = stage20.getByRole("button").last();
  if (await stageButton.isEnabled()) {
    await stageButton.click();
    const defend = page.getByRole("button", { name: /DEFEND|START|PLAY/i }).first();
    if (await defend.isVisible()) await defend.click();
  } else {
    await page.getByRole("button", { name: /← BACK|BACK/i }).first().click();
    await page.getByRole("button", { name: "DEFEND NOW" }).click();
  }

  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(4_000);

  const png = await page.locator("canvas").screenshot({ type: "png" });
  const renderCheck = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const scratch = document.createElement("canvas");
    scratch.width = image.naturalWidth;
    scratch.height = image.naturalHeight;
    const context = scratch.getContext("2d", { willReadFrequently: true });
    if (!context) return { supported: false, unique: 0, pixels: 0 };

    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, scratch.width, scratch.height).data;
    const samples = new Set<string>();
    for (let i = 0; i < data.length; i += Math.max(4, Math.floor(data.length / 1800))) {
      samples.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    }
    return { supported: true, unique: samples.size, pixels: data.length / 4 };
  }, Buffer.from(png).toString("base64"));

  expect(renderCheck.supported).toBe(true);
  expect(renderCheck.pixels).toBeGreaterThan(0);
  expect(renderCheck.unique).toBeGreaterThan(8);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
