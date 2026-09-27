import { describe, expect, test } from "bun:test";
import { resolveDamage } from "./damage";

describe("damage resolution", () => {
  test("reduces HP without killing and calculates popup/crit state", () => {
    expect(resolveDamage(100, 100, 20, 1)).toEqual({
      nextHp: 80,
      popupValue: 20,
      crit: false,
      killed: false,
      killGold: 0,
      overkill: 0,
      force: 0,
      explode: false,
    });
  });

  test("marks a large hit as a crit without requiring a kill", () => {
    const result = resolveDamage(100, 100, 35, 1);

    expect(result.crit).toBe(true);
    expect(result.killed).toBe(false);
    expect(result.nextHp).toBe(65);
  });

  test("calculates kill gold and knockback force on a normal kill", () => {
    const result = resolveDamage(10, 100, 15, 1, 1.25);

    expect(result.nextHp).toBe(-5);
    expect(result.killed).toBe(true);
    expect(result.killGold).toBe(Math.round((4 + Math.floor(100 / 12)) * 1.25));
    expect(result.overkill).toBeCloseTo(0.05);
    expect(result.force).toBeCloseTo(0.83);
    expect(result.explode).toBe(false);
  });

  test("flags exaggerated overkill for an explosive gib result", () => {
    const result = resolveDamage(1, 100, 100, 2);

    expect(result.killed).toBe(true);
    expect(result.overkill).toBeCloseTo(1.99);
    expect(result.force).toBeCloseTo(2.794);
    expect(result.explode).toBe(true);
  });

  test("uses max HP as the divisor for overkill and never divides by zero", () => {
    const result = resolveDamage(-1, 0, 10, 1);

    expect(result.killed).toBe(true);
    expect(result.overkill).toBe(3);
    expect(result.killGold).toBe(4);
    expect(result.force).toBe(2.6);
  });
});
