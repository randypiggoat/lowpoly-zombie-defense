import { test, expect } from "@playwright/test";

test("live-ops hub exposes the seasonal event and rotating daily/weekly modes", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: "Events" }).click();

  await expect(page.getByText("Live rotation", { exact: true })).toBeVisible();
  await expect(page.getByText("Today · Endless Siege", { exact: true })).toBeVisible();
  await expect(page.getByText("This week · Endless Siege", { exact: true })).toBeVisible();
  await expect(page.getByText("Weekly boss trial", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PLAY TODAY'S SIEGE" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PLAY WEEKLY SIEGE" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ENTER BOSS TRIAL" })).toBeVisible();

  await expect(page.locator("[data-seasonal-milestone]")).toHaveCount(7);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
