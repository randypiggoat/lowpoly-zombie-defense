import { describe, expect, test } from "bun:test";
import { getEnemyAnimationProfile, getEnemyFaceProfile, getEnemyHitMotion, getEnemySignatureName } from "./enemyAnimation";

describe("enemy animation profiles", () => {
  test("every enemy type has a distinct motion profile", () => {
    const profiles = Array.from({ length: 8 }, (_, index) => getEnemyAnimationProfile(index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7));
    expect(new Set(profiles.map((profile) => profile.phaseOffset)).size).toBe(8);
  });

  test("special enemies carry explicit face identities", () => {
    for (const kind of [1, 2, 3, 4, 5, 6, 7] as const) {
      const face = getEnemyFaceProfile(kind);
      expect(face.eyeColor).not.toBe(face.mouthColor);
      expect(getEnemySignatureName(kind)).toBeTypeOf("string");
    }
  });

  test("walker remains the baseline silhouette", () => {
    expect(getEnemySignatureName(0)).toBe("worn-down face");
    expect(getEnemyFaceProfile(0).markVisible).toBe(false);
  });
});

  test("weapon impacts have a readable force hierarchy", () => {
    expect(getEnemyHitMotion("rocket")).toBeGreaterThan(getEnemyHitMotion("rifleman"));
    expect(getEnemyHitMotion("rifleman")).toBeGreaterThan(getEnemyHitMotion("burn"));
    expect(getEnemyHitMotion("freezer")).toBeLessThan(getEnemyHitMotion("shotgunner"));
  });
