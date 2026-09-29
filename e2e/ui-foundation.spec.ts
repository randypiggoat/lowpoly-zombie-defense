import { test, expect } from "@playwright/test";

test("Rotwood UI foundation has tactile touch targets and screen context", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(text);
  });

  await page.goto("/");

  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await expect(page.locator(".rotwood-shell")).toHaveCount(1);
  await expect(page.locator(".rotwood-menu-tile")).toHaveCount(10);

  const primaryButton = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
  await expect(primaryButton).toBeVisible();

  const minHeight = await primaryButton.evaluate((element) => Number.parseFloat(getComputedStyle(element).minHeight));
  expect(minHeight).toBeGreaterThanOrEqual(44);

  await page.getByRole("button", { name: "Campaign" }).click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "stage-select");
  await expect(page.locator(".rotwood-shell")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
