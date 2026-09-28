import { describe, expect, test } from "bun:test";
import {
  isKillStreakMilestone,
  killStreakGoldMultiplier,
} from "./combatRewards";

describe("kill streak rewards", () => {
  test("keeps ordinary kills at base gold", () => {
    expect(killStreakGoldMultiplier(0)).toBe(1);
    expect(killStreakGoldMultiplier(2)).toBe(1);
  });

  test("ramps rewards at meaningful streak milestones", () => {
    expect(killStreakGoldMultiplier(3)).toBe(1.05);
    expect(killStreakGoldMultiplier(5)).toBe(1.1);
    expect(killStreakGoldMultiplier(10)).toBe(1.2);
    expect(killStreakGoldMultiplier(20)).toBe(1.3);
  });

  test("caps the bonus and identifies milestone moments", () => {
    expect(killStreakGoldMultiplier(999)).toBe(1.3);
    expect(isKillStreakMilestone(5)).toBe(true);
    expect(isKillStreakMilestone(6)).toBe(false);
  });
});
