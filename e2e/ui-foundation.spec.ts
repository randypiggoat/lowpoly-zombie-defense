import { test, expect } from "@playwright/test";

test("Rotwood UI foundation has tactile touch targets and screen context", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await expect(page.locator(".rotwood-shell")).toHaveCount(1);
  await expect(page.locator(".rotwood-menu-tile")).toHaveCount(8);

  const primaryButton = page.getByRole("button", { name: /DEFEND NOW|CONTINUE · STAGE/ });
  await expect(primaryButton).toBeVisible();

  const minHeight = await primaryButton.evaluate((element) => Number.parseFloat(getComputedStyle(element).minHeight));
  expect(minHeight).toBeGreaterThanOrEqual(44);

  await page.getByText("Campaign", { exact: true }).click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "stage-select");
  await expect(page.locator(".rotwood-shell")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
