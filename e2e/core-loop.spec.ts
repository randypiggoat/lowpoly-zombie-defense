import { test, expect } from "@playwright/test";

test("new player can enter gameplay from the main menu", async ({ page }) => {
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

  await expect(page.getByText("Modes", { exact: true })).toBeVisible();
  await expect(page.getByText("Progress", { exact: true })).toBeVisible();
  await expect(page.getByText("Extras", { exact: true })).toBeVisible();
  await expect(page.getByText(/DAILY SUPPLY DROP · DAY 1\/7/)).toBeVisible();
  await expect(page.getByRole("button", { name: "CLAIM" })).toBeVisible();

  const playButton = page.getByRole("button", { name: "DEFEND NOW" });
  await expect(playButton).toBeVisible();

  await playButton.click();

  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByText("BUILD YOUR FIRST TOWER", { exact: true })).toBeVisible();
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
