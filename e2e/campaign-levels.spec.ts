import { test, expect } from "@playwright/test";

test("campaign exposes all twenty locations across four worlds", async ({ page }) => {
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

  await expect(page.locator('[data-stage-id]')).toHaveCount(20);
  await expect(page.locator('[data-world-id="1"]')).toHaveCount(5);
  await expect(page.locator('[data-world-id="2"]')).toHaveCount(5);
  await expect(page.locator('[data-world-id="3"]')).toHaveCount(5);
  await expect(page.locator('[data-world-id="4"]')).toHaveCount(5);
  await expect(page.getByText("Blacksite Omega", { exact: true })).toBeVisible();
  await expect(page.locator('[data-world-id="4"]').filter({ hasText: "World 4 · Dead City" })).toHaveCount(5);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
