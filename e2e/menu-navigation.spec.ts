import { expect, test } from "@playwright/test";

test("command center routes players into focused submenus and back", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /ROTWOOD.*DEFENSE/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /THE LAST LIGHT/i })).toBeVisible();

  const backToCommandCenter = () => page.getByRole("button", { name: /COMMAND CENTER/i });

  await page.getByRole("button", { name: /Operations/i }).click();
  await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Campaign/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Endless Siege/i })).toBeVisible();
  await backToCommandCenter().click();

  await page.getByRole("button", { name: /Armory/i }).click();
  await expect(page.getByRole("heading", { name: "Armory" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tower Armory/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Field Knowledge/i })).toBeVisible();
  await backToCommandCenter().click();

  await page.getByRole("button", { name: /Field Intel/i }).click();
  await expect(page.getByRole("heading", { name: "Field Intel" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Daily Missions/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Achievements/i })).toBeVisible();
  await backToCommandCenter().click();

  await page.getByRole("button", { name: /Supply Depot/i }).click();
  await expect(page.getByRole("heading", { name: "Supply Depot" })).toBeVisible();
  await expect(page.getByText("DAILY SUPPLY DROP")).toBeVisible();
  await expect(page.getByRole("button", { name: /CLAIM|CLAIMED/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Shop & Optional Extras/i })).toBeVisible();

  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 430) {
    const screen = page.locator(".rw-screen");
    const dimensions = await screen.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
