import { test, expect, type Page } from "@playwright/test";

async function assertShell(page: Page) {
  const root = page.locator(".rotwood-app");
  await expect(root).toBeVisible();
  const size = await root.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const overflow = Math.max(
      0,
      Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
        Math.max(document.body.clientWidth, document.documentElement.clientWidth),
    );
    return { width: rect.width, height: rect.height, overflow };
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
    if (message.text().startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return;
    consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

test("Rotwood menu and settings visual smoke", async ({ page }) => {
  test.setTimeout(45_000);
  const { pageErrors, consoleErrors } = captureRealErrors(page);

  await page.goto("/?qa=1");
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "main-menu");
  await assertShell(page);

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

  const sound = page.getByRole("button", { name: /^Sound: / });
  await sound.click();
  await expect(sound).toHaveText("Sound: Off");
  await sound.click();
  await expect(sound).toHaveText("Sound: On");

  const motion = page.getByRole("button", { name: /^Reduced Motion: / });
  await motion.click();
  await expect(motion).toHaveText("Reduced Motion: On");
  await motion.click();
  await expect(motion).toHaveText("Reduced Motion: Off");

  await assertShell(page);

  await page.getByRole("button", { name: /BACK|CLOSE|← BACK/i }).first().click({ force: true });
  await page.getByRole("button", { name: "Campaign" }).click();
  await expect(page.locator(".rotwood-app")).toHaveAttribute("data-screen", "stage-select");
  await expect(page.getByText(/Suburbs|World 1/).first()).toBeVisible();
  await assertShell(page);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
