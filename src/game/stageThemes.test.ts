import { describe, expect, test } from "bun:test";
import { getStageTheme } from "./stageThemes";

describe("stage themes", () => {
  test("campaign stages have distinct visual identities", () => {
    const names = [1, 2, 3, 4, 5].map((id) => getStageTheme(id).name);
    expect(new Set(names).size).toBe(5);
  });

  test("police station is a darker night presentation", () => {
    const theme = getStageTheme(4);
    expect(theme.night).toBe(true);
    expect(theme.lightIntensity).toBeLessThan(1.2);
  });

  test("endless uses its own theme regardless of campaign stage", () => {
    expect(getStageTheme(5, true).name).toBe("Endless Siege");
  });
});
