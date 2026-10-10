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
  await page.getByRole("button", { name: /Operations/i }).click();
  await page.getByRole("button", { name: /Campaign/i }).click();

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


test("campaign victory can continue into endless without resetting the active defense", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/?qa=1");
  await page.getByRole("button", { name: /Operations/i }).click();
  await page.getByRole("button", { name: /Campaign/i }).click();
  await page.locator('[data-stage-id="1"]').getByRole("button", { name: "PLAY", exact: true }).click();
  await page.waitForFunction(() => Boolean((window as Window & { __ROTWOOD_QA__?: unknown }).__ROTWOOD_QA__));
  const before = await page.evaluate(() => {
    const qa = (window as Window & { __ROTWOOD_QA__?: {
      buildTower: (spot: number, kind: "rifleman" | "shotgunner" | "freezer") => boolean;
      forceStageVictoryForTest: () => boolean;
      getRunSnapshot: () => { towerCount: number; towerIds: number[]; gold: number; baseHp: number; wave: number; stageWaveTarget: number; gameOver: boolean; stageWon: boolean; endlessMode: boolean; continuedAfterVictory: boolean };
    } }).__ROTWOOD_QA__;
    if (!qa?.buildTower(0, "rifleman")) throw new Error("QA tower placement failed");
    return qa.getRunSnapshot();
  });
  expect(before.towerCount).toBe(1);
  await page.evaluate(() => {
    const qa = (window as Window & { __ROTWOOD_QA__?: { forceStageVictoryForTest: () => boolean } }).__ROTWOOD_QA__;
    if (!qa?.forceStageVictoryForTest()) throw new Error("QA stage victory could not be triggered");
  });
  await expect(page.getByRole("button", { name: /CONTINUE IN ENDLESS/i })).toBeVisible();
  await page.getByRole("button", { name: /CONTINUE IN ENDLESS/i }).click();
  await expect(page.getByText("Endless", { exact: true })).toBeVisible();
  const after = await page.evaluate(() => {
    const qa = (window as Window & { __ROTWOOD_QA__?: { getRunSnapshot: () => { towerCount: number; towerIds: number[]; gold: number; baseHp: number; wave: number; stageWaveTarget: number; gameOver: boolean; stageWon: boolean; endlessMode: boolean; continuedAfterVictory: boolean } } }).__ROTWOOD_QA__;
    if (!qa) throw new Error("QA run snapshot is unavailable");
    return qa.getRunSnapshot();
  });
  expect(after.endlessMode).toBe(true);
  expect(after.continuedAfterVictory).toBe(true);
  expect(after.gameOver).toBe(false);
  expect(after.stageWon).toBe(false);
  expect(after.towerIds).toEqual(before.towerIds);
  expect(after.towerCount).toBe(before.towerCount);
  expect(after.gold).toBe(before.gold);
  expect(after.baseHp).toBe(before.baseHp);
  expect(after.stageWaveTarget).toBe(before.stageWaveTarget);
  expect(after.wave).toBe(before.wave);
  expect(pageErrors).toEqual([]);
});
