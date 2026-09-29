import { test, expect, type Page } from "@playwright/test";

async function assertVisualHealth(page: Page) {
  const health = await page.locator(".rotwood-app").evaluate((root) => {
    const rect = root.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const docWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    const clientWidth = Math.max(document.body.clientWidth, document.documentElement.clientWidth);
    const visibleControls = [...root.querySelectorAll("button, input, select, textarea")]
      .filter((el) => {
        const style = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && r.width > 0 && r.height > 0;
      })
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);

    const outOfViewport = visibleControls.filter((r) =>
      r.left < -2 || r.right > viewportWidth + 2 || r.top < -2 || r.bottom > viewportHeight + 2,
    );

    return {
      width: rect.width,
      height: rect.height,
      horizontalOverflow: Math.max(0, docWidth - clientWidth),
      visibleControlCount: visibleControls.length,
      outOfViewportCount: outOfViewport.length,
    };
  });

  expect(health.width).toBeGreaterThan(300);
  expect(health.height).toBeGreaterThan(300);
  expect(health.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(health.visibleControlCount).toBeGreaterThan(0);
  expect(health.outOfViewportCount).toBe(0);
}

async function assertGameplayLayoutHealth(page: Page) {
  const health = await page.locator(".rotwood-app").evaluate((root) => {
    const rect = root.getBoundingClientRect();
    const docWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    const clientWidth = Math.max(document.body.clientWidth, document.documentElement.clientWidth);
    return {
      width: rect.width,
      height: rect.height,
      horizontalOverflow: Math.max(0, docWidth - clientWidth),
    };
  });

  expect(health.width).toBeGreaterThan(300);
  expect(health.height).toBeGreaterThan(300);
  expect(health.horizontalOverflow).toBeLessThanOrEqual(2);
}

async function openAndCheck(page: Page, buttonName: string | RegExp, expectedText: string | RegExp) {
  await page.getByRole("button", { name: buttonName }).click({ force: true });
  await expect(page.getByText(expectedText).first()).toBeVisible();
  await assertVisualHealth(page);
}

test.describe.configure({ timeout: 90_000 });

test("full Rotwood visual smoke coverage", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?qa=1");
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await assertVisualHealth(page);

  await openAndCheck(page, "Settings", "Settings");
  const soundButton = page.getByRole("button", { name: /^Sound: / });
  await soundButton.click();
  await expect(soundButton).toHaveText("Sound: Off");
  await soundButton.click();
  await expect(soundButton).toHaveText("Sound: On");

  const motionButton = page.getByRole("button", { name: /^Reduced Motion: / });
  await motionButton.click();
  await expect(motionButton).toHaveText("Reduced Motion: On");
  await motionButton.click();
  await expect(motionButton).toHaveText("Reduced Motion: Off");

  await page.getByRole("button", { name: /BACK|CLOSE|← BACK/i }).first().click({ force: true });
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");

  const screens = [
    ["Campaign", /Suburbs|World 1/],
    ["Endless Siege", "Endless Siege"],
    ["Boss Trials", "Boss Trials"],
    ["Armory", "Armory"],
    ["Knowledge", "Field Knowledge"],
    ["Collection", "Tower Skins"],
    ["Missions", "Missions"],
    ["Records", "Achievements"],
    ["Events", "Limited event"],
    ["Market", "Shop"],
  ] as const;

  for (const [buttonName, expectedText] of screens) {
    await openAndCheck(page, buttonName, expectedText);
    await expect(page.getByRole("button", { name: /← BACK/i })).toHaveCount(1);
    await page.getByRole("button", { name: /← BACK/i }).click({ force: true });
    await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  }

  const play = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
  await play.click({ force: true });
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "gameplay");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect.poll(async () => page.locator("canvas").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  })).toBe(true);

  await assertVisualHealth(page);

  // Exercise a real 3D combat path: build a Rifleman through the game API
  // exposed only in Vite dev mode with ?qa=1, then verify a projectile is emitted.
  const built = await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        buildTower: (spot: number, kind: "rifleman" | "shotgunner" | "sniper" | "tesla" | "flamethrower" | "freezer" | "rocket" | "laser") => boolean;
        buildTowerAt: (x: number, z: number, kind: "rifleman" | "shotgunner" | "sniper" | "tesla" | "flamethrower" | "freezer" | "rocket" | "laser") => boolean;
        selectTower: (id: number) => void;
        getTowerIds: () => number[];
        getCombatSnapshot: () => { towerCount: number; projectileKinds: Array<"rifleman" | "shotgunner" | "sniper" | "tesla" | "flamethrower" | "freezer" | "rocket" | "laser"> };
      };
    }).__ROTWOOD_QA__;
    return qa?.buildTowerAt(0.1, -21.9, "rifleman") ?? false;
  });
  expect(built).toBe(true);
  await expect.poll(async () => page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        getCombatSnapshot: () => { towerCount: number; projectileKinds: string[]; projectileEmissions: number };
      };
    }).__ROTWOOD_QA__;
    const snapshot = qa?.getCombatSnapshot();
    return snapshot ? snapshot.towerCount > 0 && snapshot.projectileEmissions > 0 : false;
  }), { timeout: 10000 }).toBe(true);

  const towerId = await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        getCombatSnapshot: () => { towerCount: number; projectileKinds: string[] };
        selectTower: (id: number) => void;
      };
    }).__ROTWOOD_QA__;
    const id = qa?.getTowerIds()?.[0] ?? -1;
    if (qa && id > 0) qa.selectTower(id);
    return id;
  });
  if (towerId > 0) {
    await expect(page.getByText(/Spend SCRAP on one path at a time/)).toBeVisible();
    await expect(page.getByText("RECON", { exact: true })).toBeVisible();
    await expect(page.getByText("SUSTAINED FIRE", { exact: true })).toBeVisible();
    await expect(page.getByText(/Workshop/i)).toHaveCount(0);
    await assertGameplayLayoutHealth(page);
  }

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await assertGameplayLayoutHealth(page);
  await page.getByRole("button", { name: "RESUME" }).click();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
