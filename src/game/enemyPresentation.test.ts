import { describe, expect, test } from "bun:test";
import {
  enemyIdentity,
  enemyThreatLabel,
  enemyThreatRole,
  getEnemyHealthBarPresentation,
  shouldShowEnemyHealthBar,
} from "./enemyPresentation";
import type { StageEnemyKind } from "./navigation";

describe("enemy presentation", () => {
  test("gives each enemy a distinct, reusable identity and role", () => {
    const kinds: StageEnemyKind[] = [0, 1, 2, 3, 4, 5, 6, 7];
    const identities = kinds.map(enemyIdentity);
    expect(identities.map(({ name }) => name)).toEqual([
      "Walker",
      "Runner",
      "Brute",
      "Splitter",
      "Bomber",
      "Guardian",
      "Healer",
      "Swarm",
    ]);
    expect(identities.map(({ role }) => role)).toEqual([
      "STANDARD",
      "FAST",
      "TANK",
      "SPLITS",
      "EXPLODES",
      "SHIELDS",
      "HEALS",
      "PACK",
    ]);
    expect(new Set(identities.map(({ healthBarColor }) => healthBarColor)).size).toBe(8);
    expect(enemyThreatLabel(6)).toBe("HEALER");
    expect(enemyThreatRole(6)).toBe("HEALS");
  });

  test("shows health bars only for special enemies", () => {
    expect(shouldShowEnemyHealthBar(0, 10, 10)).toBe(false);
    expect(shouldShowEnemyHealthBar(2, 10, 20)).toBe(true);
    expect(shouldShowEnemyHealthBar(7, 1, 2)).toBe(true);
  });

  test("uses distinct special-enemy health bar colors and preserves boss treatment", () => {
    expect(getEnemyHealthBarPresentation(2, 10, 20).color).toBe("#fb923c");
    expect(getEnemyHealthBarPresentation(6, 10, 20).color).toBe("#4ade80");
    expect(getEnemyHealthBarPresentation(2, 10, 20, true)).toMatchObject({
      show: true,
      widthMultiplier: 1.6,
      color: "#e9b44c",
    });
  });

  test("uses recognizable threat labels", () => {
    expect(enemyThreatLabel(2)).toBe("BRUTE");
    expect(enemyThreatLabel(4)).toBe("BOMBER");
    expect(enemyThreatLabel(7)).toBe("SWARM");
  });
});
