import { describe, expect, test } from "bun:test";
import {
  BOSS_ENRAGE_HP_RATIO,
  BOSS_ENRAGE_SPEED_MULTIPLIER,
  bossSpeedMultiplier,
  shouldBossEnrage,
} from "./bossBehavior";

describe("boss enrage behavior", () => {
  test("enrages a living boss at half health", () => {
    expect(shouldBossEnrage(true, 50, 100, false)).toBe(true);
    expect(shouldBossEnrage(true, 51, 100, false)).toBe(false);
  });

  test("does not repeatedly trigger or affect normal enemies", () => {
    expect(shouldBossEnrage(true, 40, 100, true)).toBe(false);
    expect(shouldBossEnrage(false, 40, 100, false)).toBe(false);
    expect(shouldBossEnrage(true, 0, 100, false)).toBe(false);
  });

  test("enraged bosses move faster while normal enemies stay unchanged", () => {
    expect(bossSpeedMultiplier(true, true)).toBe(BOSS_ENRAGE_SPEED_MULTIPLIER);
    expect(bossSpeedMultiplier(true, false)).toBe(1);
    expect(bossSpeedMultiplier(false, true)).toBe(1);
    expect(BOSS_ENRAGE_HP_RATIO).toBe(0.5);
  });
});
