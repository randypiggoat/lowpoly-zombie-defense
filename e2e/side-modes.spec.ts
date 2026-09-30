import { test, expect } from "@playwright/test";

test("side modes expose resource and challenge progression", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
  });

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: "Side Modes" }).click();

  await expect(page.getByText("RESOURCE OPS", { exact: true })).toBeVisible();
  await expect(page.getByText("CHALLENGE GAUNTLET", { exact: true })).toBeVisible();
  await expect(page.getByText("Scrap Run I", { exact: true })).toBeVisible();
  await expect(page.getByText("One Tower", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ENDLESS EXPEDITION" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("seasonal event offers an active playable run", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
  });

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: "Events" }).click();
  await expect(page.getByText("PLAY THE EVENT", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PLAY EVENT RUN" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
