import { expect, test } from "@playwright/test";

test("phone-first survival hub routes into stage retries, challenges, and the tower workshop", async ({ page }) => {
  await page.goto("/");

  const root = page.locator(".rotwood-app");
  const finishTransition = async () =>
    await expect(root).toHaveAttribute("data-screen-transition", "idle", { timeout: 5_000 });

  await expect(page.getByRole("heading", { name: /ROTWOOD.*DEFENSE/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /THE LAST LIGHT/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Between Runs" })).toBeVisible();

  await page.getByRole("button", { name: /VIEW STAGE MAP/i }).click();
  await expect(root).toHaveAttribute("data-screen", "stage-select");
  await finishTransition();
  await expect(page.getByRole("heading", { name: /Stage Map/i })).toBeVisible();
  await expect(page.locator("[data-stage-id='1']")).toBeVisible();
  await page.getByRole("button", { name: /MAIN MENU/i }).click();
  await expect(root).toHaveAttribute("data-screen", "main-menu");
  await finishTransition();

  await page.getByRole("button", { name: /Challenges/i }).click();
  await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();
  await finishTransition();
  await expect(page.getByRole("button", { name: /Stage Map/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Endless Siege/i })).toBeVisible();
  await page.getByRole("button", { name: /MAIN MENU/i }).click();
  await expect(root).toHaveAttribute("data-screen", "main-menu");
  await finishTransition();

  await page.getByRole("button", { name: /Tower Workshop/i }).click();
  await expect(page.getByRole("heading", { name: "Tower Workshop" })).toBeVisible();
  await finishTransition();
  await page.getByRole("button", { name: /Field Knowledge/i }).click();
  await expect(page.getByRole("heading", { name: "Field Knowledge" })).toBeVisible();
  await finishTransition();
  await page.getByRole("button", { name: /TOWER WORKSHOP/i }).click();
  await expect(page.getByRole("heading", { name: "Tower Workshop" })).toBeVisible();
  await finishTransition();
  await page.getByRole("button", { name: /Tower Armory/i }).click();
  await expect(page.getByRole("heading", { name: "Tower Armory" })).toBeVisible();
  await finishTransition();
  await page.getByRole("button", { name: /TOWER WORKSHOP/i }).click();
  await expect(page.getByRole("heading", { name: "Tower Workshop" })).toBeVisible();
  await finishTransition();
  await page.getByRole("button", { name: /MAIN MENU/i }).click();
  await expect(root).toHaveAttribute("data-screen", "main-menu");
  await finishTransition();

  await page.getByRole("button", { name: /Field Intel/i }).click();
  await expect(page.getByRole("heading", { name: "Field Intel" })).toBeVisible();
  await finishTransition();
  await expect(page.getByRole("button", { name: /Daily Missions/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Achievements/i })).toBeVisible();
  await page.getByRole("button", { name: /MAIN MENU/i }).click();
  await expect(root).toHaveAttribute("data-screen", "main-menu");
  await finishTransition();

  await page.getByRole("button", { name: /Supply Depot/i }).click();
  await expect(page.getByRole("heading", { name: "Supply Depot" })).toBeVisible();
  await finishTransition();
  await expect(page.getByText("DAILY SUPPLY DROP")).toBeVisible();
  await expect(page.getByRole("button", { name: /CLAIM|CLAIMED/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Shop & Optional Extras/i })).toBeVisible();

  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 430) {
    const screen = page.locator(".rw-screen").last();
    const dimensions = await screen.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
