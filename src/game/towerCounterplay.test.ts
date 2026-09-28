import { describe, expect, test } from "bun:test";
import {
  towerCounterplayLabels,
  towerEnemyDamageMultiplier,
} from "./towerCounterplay";

describe("tower counterplay", () => {
  test("specialized towers get their intended matchup bonuses", () => {
    expect(towerEnemyDamageMultiplier("rifleman", 1)).toBeCloseTo(1.18);
    expect(towerEnemyDamageMultiplier("sniper", 2)).toBeCloseTo(1.25);
    expect(towerEnemyDamageMultiplier("laser", 5)).toBeCloseTo(1.25);
  });

  test("general matchups remain neutral", () => {
    expect(towerEnemyDamageMultiplier("rifleman", 0)).toBe(1);
    expect(towerEnemyDamageMultiplier("sniper", 7)).toBe(1);
  });

  test("counterplay labels are available for UI discovery", () => {
    expect(towerCounterplayLabels("shotgunner")).toEqual([
      "Splitter +18% damage",
      "Swarm +22% damage",
    ]);
  });
});
