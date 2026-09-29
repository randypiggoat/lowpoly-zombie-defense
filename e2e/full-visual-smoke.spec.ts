import { test, expect, type Page } from "@playwright/test";

async function assertVisualHealth(page: Page) {
  await expect.poll(
    async () =>
      page.locator(".rotwood-app").evaluate((root) => {
        const rect = root.getBoundingClientRect();
        return rect.width > 300 && rect.height > 300;
      }),
    { timeout: 10000 },
  ).toBe(true);

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
      })
      .filter((el) => {
        // Ignore controls that are visually covered by a higher z-index modal/overlay.
        // Those controls remain in the HUD DOM while a pause/settings layer is open,
        // but they are not actually visible or interactive to the player.
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x < 0 || x > viewportWidth || y < 0 || y > viewportHeight) return false;
        const hit = document.elementFromPoint(x, y);
        return hit === el || Boolean(hit && el.contains(hit));
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

    const controls = visible.filter((el) => ["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(el.tagName));
    const overlaps: string[] = [];
    for (let i = 0; i < controls.length; i++) {
      const a = controls[i]!.getBoundingClientRect();
      for (let j = i + 1; j < controls.length; j++) {
        const b = controls[j]!.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (overlapWidth * overlapHeight > 36) {
          overlaps.push(
            `${(controls[i]!.textContent ?? "").trim().slice(0, 40)} <> ${(controls[j]!.textContent ?? "").trim().slice(0, 40)}`,
          );
        }
      }
    }

    const clippedControls = controls
      .filter((el) => {
        if (isInsideScrollable(el)) return false;
        return el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
      })
      .map((el) => (el.textContent ?? "").trim().slice(0, 60));

    return {
      rootWidth: rect.width,
      rootHeight: rect.height,
      horizontalOverflow: Math.max(0, docWidth - clientWidth),
      visibleCount: visible.length,
      outOfViewport,
      overlaps,
      clippedControls,
    };
  });

  expect(health.rootWidth).toBeGreaterThan(300);
  expect(health.rootHeight).toBeGreaterThan(300);
  expect(health.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(health.outOfViewport).toEqual([]);
  expect(health.overlaps).toEqual([]);
  expect(health.clippedControls).toEqual([]);
}

async function openAndCheck(page: Page, buttonName: string | RegExp, expectedText: string | RegExp) {
  await page.getByRole("button", { name: buttonName }).click({ force: true });
  await expect(page.getByText(expectedText).first()).toBeVisible();
  await assertVisualHealth(page);
}

test.describe.configure({ timeout: 120_000 });

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
        getCombatSnapshot: () => { towerCount: number; projectileKinds: string[] };
      };
    }).__ROTWOOD_QA__;
    const snapshot = qa?.getCombatSnapshot();
    return snapshot ? snapshot.towerCount > 0 && snapshot.projectileKinds.includes("rifleman") : false;
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
    await assertVisualHealth(page);
  }

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await assertVisualHealth(page);
  await page.getByRole("button", { name: "RESUME" }).click();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
