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

  const playButton = page.getByRole("button", { name: "DEFEND NOW" });
  await expect(playButton).toBeVisible();

  await playButton.click();

  await expect(page.getByText("Wave", { exact: true })).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByText("BUILD YOUR FIRST TOWER", { exact: true })).toBeVisible();

  await expect(page.locator("canvas")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
