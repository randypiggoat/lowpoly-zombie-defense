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


test("tower placement follows pointer across both world axes and builds at the selected point", async ({ page }) => {
  await page.goto("/?qa=1");

  const playButton = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
  await expect(playButton).toBeVisible();
  await playButton.click();
  await expect(page.locator("canvas")).toHaveCount(1);

  await expect.poll(() =>
    page.evaluate(() => Boolean((window as Window & { __ROTWOOD_QA__?: unknown }).__ROTWOOD_QA__)),
  ).toBe(true);

  const qa = () =>
    page.evaluate(() => {
      const api = (window as Window & {
        __ROTWOOD_QA__?: {
          getPlacementPreview: () => { x: number; z: number } | null;
          getPlacementStatus: () => { valid: boolean; reason: string } | null;
          getTowerPositions: () => Array<{ id: number; x: number; z: number; kind: "rifleman" }>;
        };
      }).__ROTWOOD_QA__;
      if (!api) return null;
      return {
        preview: api.getPlacementPreview(),
        status: api.getPlacementStatus(),
        towers: api.getTowerPositions(),
      };
    });

  // Disable only the HUD's interactive hit targets while probing the game surface,
  // so the mouse is guaranteed to reach the R3F placement plane at every test point.
  const pointerProbeStyle = await page.addStyleTag({
    content: ".rotwood-hud .pointer-events-auto { pointer-events: none !important; }",
  });

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const point = (x: number, y: number) => ({
    x: box!.x + box!.width * x,
    y: box!.y + box!.height * y,
  });

  const moveAndRead = async (x: number, y: number) => {
    const target = point(x, y);
    await page.mouse.move(target.x, target.y);
    await expect.poll(async () => (await qa())?.preview).not.toBeNull();
    return (await qa())!.preview!;
  };

  const left = await moveAndRead(0.28, 0.68);
  const upper = await moveAndRead(0.50, 0.46);
  const right = await moveAndRead(0.72, 0.68);

  expect(Math.abs(right.x - left.x)).toBeGreaterThan(0.5);
  expect(Math.abs(upper.z - left.z)).toBeGreaterThan(0.5);

  const candidates = [
    [0.28, 0.68],
    [0.50, 0.68],
    [0.72, 0.68],
    [0.40, 0.58],
    [0.60, 0.58],
    [0.50, 0.78],
  ] as const;

  let selected: { x: number; y: number } | null = null;
  let selectedPreview: { x: number; z: number } | null = null;
  for (const [x, y] of candidates) {
    const preview = await moveAndRead(x, y);
    const status = (await qa())?.status;
    if (status?.valid) {
      selected = point(x, y);
      selectedPreview = preview;
      break;
    }
  }

  expect(selected).not.toBeNull();
  expect(selectedPreview).not.toBeNull();

  // Dispatch the actual browser pointer event on the canvas element itself so
  // the production canvas listener handles the tested map coordinate directly.
  await canvas.dispatchEvent("pointerdown", {
    bubbles: true,
    clientX: selected!.x,
    clientY: selected!.y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  });
  await expect(page.getByText("Build a tower", { exact: true })).toBeVisible();

  const committedPreview = (await qa())!.preview;
  expect(committedPreview).not.toBeNull();

  // Restore normal HUD hit testing before verifying the real build-button interaction.
  await pointerProbeStyle.evaluate((element) => element.remove());

  const before = (await qa())!.towers.length;
  const buildButtons = page.getByRole("button", { name: /^Build ·/ });
  await expect(buildButtons.first()).toBeVisible();
  await expect(buildButtons.first()).toBeEnabled();
  await buildButtons.first().click();

  await expect.poll(async () => (await qa())!.towers.length).toBe(before + 1);
  const towers = (await qa())!.towers;
  const built = towers[towers.length - 1]!;

  expect(built.x).toBe(committedPreview!.x);
  expect(built.z).toBe(committedPreview!.z);
});

test("tower placement responds to touch coordinates on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("iphone"), "Touch-specific regression runs on the iPhone project.");

  await page.goto("/?qa=1");
  await page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ }).click();
  await expect(page.locator("canvas")).toHaveCount(1);

  await expect.poll(() =>
    page.evaluate(() => Boolean((window as Window & { __ROTWOOD_QA__?: unknown }).__ROTWOOD_QA__)),
  ).toBe(true);

  const readPreview = () =>
    page.evaluate(() => {
      const api = (window as Window & {
        __ROTWOOD_QA__?: { getPlacementPreview: () => { x: number; z: number } | null };
      }).__ROTWOOD_QA__;
      return api?.getPlacementPreview() ?? null;
    });

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const dispatchTouchMove = async (x: number, y: number) => {
    await canvas.evaluate(
      (element, coords) => {
        element.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: coords.x,
            clientY: coords.y,
            pointerId: 1,
            pointerType: "touch",
            isPrimary: true,
          }),
        );
      },
      { x, y },
    );
    await expect.poll(readPreview).not.toBeNull();
    return (await readPreview())!;
  };

  const first = {
    x: box!.x + box!.width * 0.35,
    y: box!.y + box!.height * 0.68,
  };
  const second = {
    x: box!.x + box!.width * 0.65,
    y: box!.y + box!.height * 0.52,
  };

  const firstPreview = await dispatchTouchMove(first.x, first.y);
  const secondPreview = await dispatchTouchMove(second.x, second.y);

  expect(Math.abs(secondPreview.x - firstPreview.x)).toBeGreaterThan(0.5);
  expect(Math.abs(secondPreview.z - firstPreview.z)).toBeGreaterThan(0.5);
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
