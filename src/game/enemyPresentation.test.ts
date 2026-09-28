import { describe, expect, test } from "bun:test";
import { enemyThreatLabel, shouldShowEnemyHealthBar } from "./enemyPresentation";

describe("enemy presentation", () => {
  test("shows health bars only for special enemies", () => {
    expect(shouldShowEnemyHealthBar(0, 10, 10)).toBe(false);
    expect(shouldShowEnemyHealthBar(2, 10, 20)).toBe(true);
    expect(shouldShowEnemyHealthBar(7, 1, 2)).toBe(true);
  });

  test("uses recognizable threat labels", () => {
    expect(enemyThreatLabel(2)).toBe("BRUTE");
    expect(enemyThreatLabel(4)).toBe("BOMBER");
    expect(enemyThreatLabel(7)).toBe("SWARM");
  });
});
