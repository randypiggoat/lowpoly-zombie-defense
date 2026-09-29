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


test("streamlined upgrade UI hides combat math while keeping upgrade effects readable", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const value = message.text();
    if (value.startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(value);
  });

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: "Armory" }).click();
  await expect(page.getByText("Tower guide", { exact: true })).toBeVisible();
  await expect(page.getByText("Scout Optic", { exact: true })).toBeVisible();
  await expect(page.getByText("Double Tap", { exact: true })).toBeVisible();
  await expect(page.getByText("Longer sightline; the Rifleman learns to watch the map.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /BACK|← BACK/i }).first().click();
  await page.getByRole("button", { name: "Campaign" }).click();
  await expect(page.getByText("Completion Reward:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("First Clear Bonus:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Reward x", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Waves:", { exact: false })).toHaveCount(0);

  await page.getByRole("button", { name: "PLAY" }).first().click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "gameplay");

  await expect.poll(() =>
    page.evaluate(() => Boolean((window as Window & { __ROTWOOD_QA__?: unknown }).__ROTWOOD_QA__)),
  ).toBe(true);

  const built = await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        buildTower: (spot: number, kind: "rifleman") => boolean;
        getTowerIds: () => number[];
        selectTower: (id: number) => void;
      };
    }).__ROTWOOD_QA__;
    if (!qa) return false;
    return qa.buildTower(0, "rifleman");
  });
  expect(built).toBe(true);

  await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: { getTowerIds: () => number[]; selectTower: (id: number) => void };
    }).__ROTWOOD_QA__;
    const id = qa?.getTowerIds()[0];
    if (qa && id !== undefined) qa.selectTower(id);
  });

  await expect(page.getByText("Scout Optic", { exact: true })).toBeVisible();
  await expect(page.getByText("Double Tap", { exact: true })).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain(" DMG");
  expect(bodyText).not.toContain(" RNG");
  expect(bodyText).not.toContain("% PATH");
  expect(bodyText).not.toContain("GOOD MATCH");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
