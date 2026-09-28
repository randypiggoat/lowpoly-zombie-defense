import { test, expect, type Page } from "@playwright/test";

async function assertVisualHealth(page: Page) {
  const health = await page.locator(".rotwood-app").evaluate((root) => {
    const rect = root.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const docWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    const clientWidth = Math.max(document.body.clientWidth, document.documentElement.clientWidth);

    const visible = [...root.querySelectorAll("button, [role='button'], input, select, textarea")]
      .filter((el) => {
        const style = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && r.width > 0 && r.height > 0;
      });

    const isInsideScrollable = (el: Element) => {
      let parent = el.parentElement;
      while (parent && parent !== root) {
        const style = getComputedStyle(parent);
        if (/(auto|scroll)/.test(style.overflowY) || /(auto|scroll)/.test(style.overflow)) return true;
        parent = parent.parentElement;
      }
      return false;
    };

    const outOfViewport = visible
      .filter((el) => !isInsideScrollable(el))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < -2 || r.right > viewportWidth + 2 || r.top < -2 || r.bottom > viewportHeight + 2;
      })
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent ?? "").trim().slice(0, 80),
      }));

    return {
      rootWidth: rect.width,
      rootHeight: rect.height,
      horizontalOverflow: Math.max(0, docWidth - clientWidth),
      visibleCount: visible.length,
      outOfViewport,
    };
  });

  expect(health.rootWidth).toBeGreaterThan(300);
  expect(health.rootHeight).toBeGreaterThan(300);
  expect(health.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(health.outOfViewport).toEqual([]);
}

async function openAndCheck(page: Page, buttonName: string | RegExp, expectedText: string | RegExp) {
  await page.getByRole("button", { name: buttonName }).click();
  await expect(page.getByText(expectedText).first()).toBeVisible();
  await assertVisualHealth(page);
}

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

  await page.getByRole("button", { name: /BACK|CLOSE|← BACK/i }).first().click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");

  const screens = [
    ["Campaign", /Suburbs|World 1/],
    ["Endless Siege", "Endless Siege"],
    ["Boss Trials", "Boss Trials"],
    ["Towers", "Towers"],
    ["Collection", "Tower Skins"],
    ["Missions", "Missions"],
    ["Records", "Achievements"],
    ["Events", "Limited event"],
    ["Market", "Shop"],
  ] as const;

  for (const [buttonName, expectedText] of screens) {
    await openAndCheck(page, buttonName, expectedText);
    await page.getByRole("button", { name: /← BACK/i }).click();
    await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  }

  const play = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
  await play.click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "gameplay");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect.poll(async () => page.locator("canvas").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  })).toBe(true);

  await page.waitForTimeout(900);
  await assertVisualHealth(page);

  // Exercise a real 3D combat path: build a Rifleman through the game API
  // exposed only in Vite dev mode with ?qa=1, then verify a projectile is emitted.
  const built = await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        buildTower: (spot: number, kind: "rifleman" | "shotgunner" | "sniper" | "tesla" | "flamethrower" | "freezer" | "rocket" | "laser") => boolean;
        getCombatSnapshot: () => { towerCount: number; projectileKinds: Array<"rifleman" | "shotgunner" | "sniper" | "tesla" | "flamethrower" | "freezer" | "rocket" | "laser"> };
      };
    }).__ROTWOOD_QA__;
    return qa?.buildTower(0, "rifleman") ?? false;
  });
  expect(built).toBe(true);
  await expect.poll(async () => page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        getCombatSnapshot: () => { towerCount: number; projectileKinds: string[] };
      };
    }).__ROTWOOD_QA__;
    const snapshot = qa?.getCombatSnapshot();
    return snapshot ? snapshot.towerCount > 0 && snapshot.projectileKinds.includes("rifleman") : false;
  }), { timeout: 10000 }).toBe(true);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await assertVisualHealth(page);
  await page.getByRole("button", { name: "RESUME" }).click();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
