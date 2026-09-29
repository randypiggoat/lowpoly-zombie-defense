import { test, expect, type Page } from "@playwright/test";

async function assertShell(page: Page) {
  const shell = page.locator(".rotwood-app");
  await expect(shell).toBeVisible();
  const size = await shell.evaluate((root) => {
    const r = root.getBoundingClientRect();
    return {
      width: r.width,
      height: r.height,
      overflow: Math.max(
        0,
        Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
          Math.max(document.body.clientWidth, document.documentElement.clientWidth),
      ),
    };
  });
  expect(size.width).toBeGreaterThan(300);
  expect(size.height).toBeGreaterThan(300);
  expect(size.overflow).toBeLessThanOrEqual(2);
}

function captureRealErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // React 19 + R3F/Drei can emit this development-only renderer warning while
    // async text/canvas objects mount. It does not represent a page exception.
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

test("Rotwood major screens and gameplay smoke", async ({ page }) => {
  const { pageErrors, consoleErrors } = captureRealErrors(page);

  await page.goto("/?qa=1");
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await assertShell(page);

  // Verify the complete main-menu surface without opening/reloading ten WebGL scenes.
  for (const name of [
    "Campaign",
    "Endless Siege",
    "Boss Trials",
    "Armory",
    "Knowledge",
    "Collection",
    "Missions",
    "Records",
    "Events",
    "Market",
  ]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sound: / })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Reduced Motion: / })).toBeVisible();
  await assertShell(page);

  await page.getByRole("button", { name: /BACK|CLOSE|← BACK/i }).first().click({ force: true });
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");

  for (const [buttonName, expectedText] of [
    ["Campaign", /Suburbs|World 1/],
    ["Boss Trials", "Weekly rotation"],
  ] as const) {
    await page.getByRole("button", { name: buttonName }).click({ force: true });
    await expect(page.getByText(expectedText).first()).toBeVisible();
    await assertShell(page);
    await page.getByRole("button", { name: /← BACK/i }).click({ force: true });
    await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  }

  await page.getByRole("button", { name: "DEFEND NOW" }).click({ force: true });
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "gameplay");
  await expect(page.locator("canvas")).toHaveCount(1);
  await assertShell(page);

  const built = await page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        buildTowerAt: (x: number, z: number, kind: string) => boolean;
        getCombatSnapshot: () => { towerCount: number; projectileEmissions: number };
      };
    }).__ROTWOOD_QA__;
    return qa?.buildTowerAt(0.1, -21.9, "rifleman") ?? false;
  });
  expect(built).toBe(true);

  await expect.poll(async () => page.evaluate(() => {
    const qa = (window as Window & {
      __ROTWOOD_QA__?: {
        getCombatSnapshot: () => { towerCount: number; projectileEmissions: number };
      };
    }).__ROTWOOD_QA__;
    const snapshot = qa?.getCombatSnapshot();
    return snapshot ? snapshot.towerCount > 0 && snapshot.projectileEmissions > 0 : false;
  }), { timeout: 10000 }).toBe(true);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await assertShell(page);
  await page.getByRole("button", { name: "RESUME" }).click();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
