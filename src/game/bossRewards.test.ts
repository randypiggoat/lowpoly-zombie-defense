import { describe, expect, test } from "bun:test";
import { bossKillGoldMultiplier } from "./bossRewards";

describe("boss kill rewards", () => {
  test("bosses pay a stronger run-gold bonus", () => {
    expect(bossKillGoldMultiplier(true)).toBe(1.5);
  });

  test("normal enemies keep their existing payout multiplier", () => {
    expect(bossKillGoldMultiplier(false)).toBe(1);
  });
});
