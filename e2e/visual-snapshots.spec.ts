import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

type CaptureViewport = {
  id: string;
  width: number;
  height: number;
  project: "chromium" | "iphone";
  cameraProfile: "portrait" | "compact-landscape" | "landscape" | "wide-landscape";
};

const CAPTURE_VIEWPORTS: CaptureViewport[] = [
  { id: "desktop-1920x1080", width: 1920, height: 1080, project: "chromium", cameraProfile: "landscape" },
  { id: "laptop-1366x768", width: 1366, height: 768, project: "chromium", cameraProfile: "landscape" },
  { id: "phone-portrait-390x844", width: 390, height: 844, project: "iphone", cameraProfile: "portrait" },
  { id: "phone-landscape-844x390", width: 844, height: 390, project: "iphone", cameraProfile: "wide-landscape" },
];

const SNAPSHOT_DIRECTORY = resolve(process.cwd(), "artifacts", "visual-snapshots");

for (const viewport of CAPTURE_VIEWPORTS) {
  test(`captures gameplay screenshots at ${viewport.id}`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== viewport.project,
      `This viewport is captured in the ${viewport.project} Playwright project.`,
    );
    test.setTimeout(90_000);

    mkdirSync(SNAPSHOT_DIRECTORY, { recursive: true });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/?qa=1");

    await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
    const playButton = page.getByRole("button", { name: /DEFEND NOW|CONTINUE DEFENSE/ });
    await expect(playButton).toBeVisible();
    await playButton.click();

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.locator(".rw-lives-display")).toBeVisible();
    await expect(page.locator(".rw-enemies-card")).toBeVisible();

    await expect.poll(() => canvas.getAttribute("data-camera-profile"), {
      message: `Camera profile should match the ${viewport.id} viewport.`,
    }).toBe(viewport.cameraProfile);

    const renderMetrics = await canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        pixelRatio: Number(element.dataset["renderPixelRatio"]),
        cssWidth: rect.width,
        cssHeight: rect.height,
        drawingBufferWidth: element.width,
        drawingBufferHeight: element.height,
        cameraProfile: element.dataset["cameraProfile"],
        cameraFov: Number(element.dataset["cameraFov"]),
        antialias: element.dataset["renderAntialias"],
      };
    });

    expect(renderMetrics.pixelRatio, "renderer must not render below CSS-pixel resolution").toBeGreaterThanOrEqual(1);
    expect(renderMetrics.drawingBufferWidth).toBeGreaterThanOrEqual(Math.floor(renderMetrics.cssWidth));
    expect(renderMetrics.drawingBufferHeight).toBeGreaterThanOrEqual(Math.floor(renderMetrics.cssHeight));
    expect(renderMetrics.cameraFov).toBeGreaterThan(0);
    expect(renderMetrics.antialias).toBe(viewport.project === "chromium" ? "true" : "false");

    await expect.poll(() =>
      page.evaluate(() => Boolean((window as Window & { __ROTWOOD_QA__?: unknown }).__ROTWOOD_QA__)),
    ).toBe(true);

    const towerBuilt = await page.evaluate(() => {
      const api = (window as Window & {
        __ROTWOOD_QA__?: {
          buildTower: (spot: number, kind: "rifleman") => boolean;
          getRunSnapshot: () => { towerCount: number; wave: number };
        };
      }).__ROTWOOD_QA__;
      return api?.buildTower(0, "rifleman") ?? false;
    });
    expect(towerBuilt, "a starter Rifleman should build successfully in the captured game").toBe(true);

    await expect.poll(
      () =>
        page.evaluate(() => {
          const api = (window as Window & {
            __ROTWOOD_QA__?: {
              getCombatSnapshot: () => { activeZombieCount: number };
              getRunSnapshot: () => { wave: number };
            };
          }).__ROTWOOD_QA__;
          return api ? api.getCombatSnapshot().activeZombieCount : 0;
        }),
      {
        timeout: 25_000,
        intervals: [100, 250, 500],
        message: "An actual active zombie should appear before the gameplay screenshots are taken.",
      },
    ).toBeGreaterThan(0);

    const waveNumber = await page.evaluate(() => {
      const api = (window as Window & { __ROTWOOD_QA__?: { getRunSnapshot: () => { wave: number } } }).__ROTWOOD_QA__;
      return api?.getRunSnapshot().wave ?? 0;
    });
    expect(waveNumber, "capture should be during an actual wave").toBeGreaterThan(0);

    // Let fonts and a pair of paint frames settle, without pausing the live simulation.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
      await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    });

    const stem = `${viewport.id}-${testInfo.project.name}-wave-${waveNumber}`;
    const fullViewportPath = resolve(SNAPSHOT_DIRECTORY, `${stem}-full-viewport.png`);
    const canvasOnlyPath = resolve(SNAPSHOT_DIRECTORY, `${stem}-canvas-only.png`);

    await page.screenshot({
      path: fullViewportPath,
      fullPage: false,
      animations: "disabled",
      caret: "hide",
    });
    const canvasPng = await canvas.screenshot({
      path: canvasOnlyPath,
      animations: "disabled",
      caret: "hide",
    });

    expect(existsSync(fullViewportPath), "full viewport screenshot file should exist").toBe(true);
    expect(existsSync(canvasOnlyPath), "canvas screenshot file should exist").toBe(true);
    expect(statSync(fullViewportPath).size, "full viewport screenshot should not be empty").toBeGreaterThan(1_000);
    expect(statSync(canvasOnlyPath).size, "canvas screenshot should not be empty").toBeGreaterThan(1_000);

    const canvasContentCheck = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const sample = document.createElement("canvas");
      sample.width = image.naturalWidth;
      sample.height = image.naturalHeight;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) return { supported: false, uniqueColors: 0, width: 0, height: 0 };

      context.drawImage(image, 0, 0);
      const colors = new Set<string>();
      for (const xRatio of [0.15, 0.35, 0.5, 0.65, 0.85]) {
        for (const yRatio of [0.2, 0.4, 0.6, 0.8]) {
          const x = Math.min(sample.width - 1, Math.floor(sample.width * xRatio));
          const y = Math.min(sample.height - 1, Math.floor(sample.height * yRatio));
          const pixel = context.getImageData(x, y, 1, 1).data;
          colors.add(`${pixel[0]},${pixel[1]},${pixel[2]}`);
        }
      }
      return {
        supported: true,
        uniqueColors: colors.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
    }, canvasPng.toString("base64"));

    expect(canvasContentCheck.supported).toBe(true);
    expect(canvasContentCheck.width).toBeGreaterThan(100);
    expect(canvasContentCheck.height).toBeGreaterThan(100);
    expect(canvasContentCheck.uniqueColors, "canvas screenshot should contain rendered scene content").toBeGreaterThan(2);

  });
}
