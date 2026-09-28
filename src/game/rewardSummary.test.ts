import { describe, expect, test } from "bun:test";
import { calculateKillReward } from "./rewardSummary";

describe("kill reward breakdown", () => {
  test("keeps the base reward separate from streak and boss bonuses", () => {
    expect(calculateKillReward(10, 1, 1.2, 1.5)).toEqual({
      baseGold: 10,
      streakBonusGold: 2,
      bossBonusGold: 6,
      totalGold: 18,
    });
  });

  test("clamps bonus multipliers below one to neutral", () => {
    expect(calculateKillReward(10, 1.3, 0.5, 0.5)).toEqual({
      baseGold: 13,
      streakBonusGold: 0,
      bossBonusGold: 0,
      totalGold: 13,
    });
  });
});
