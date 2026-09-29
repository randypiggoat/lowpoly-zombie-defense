import { describe, expect, test } from "bun:test";
import { getStageTheme } from "./stageThemes";

describe("stage themes", () => {
  test("all twenty campaign stages have distinct visual identities", () => {
    const themes = Array.from({ length: 20 }, (_, index) => getStageTheme(index + 1));
    expect(new Set(themes.map((theme) => theme.name)).size).toBe(20);
    expect(new Set(themes.map((theme) => theme.sky)).size).toBeGreaterThan(15);
  });

  test("later campaign introduces darker environmental presentations", () => {
    expect(getStageTheme(10).night).toBe(true);
    expect(getStageTheme(14).night).toBe(true);
    expect(getStageTheme(18).night).toBe(true);
    expect(getStageTheme(20).night).toBe(true);
  });

  test("endless uses its own theme regardless of campaign stage", () => {
    expect(getStageTheme(20, true).name).toBe("Endless Siege");
  });

  test("boss trials use a dedicated high-contrast arena theme", () => {
    const theme = getStageTheme(20, false, true);
    expect(theme.name).toBe("Boss Trial Arena");
    expect(theme.night).toBe(true);
  });
});
