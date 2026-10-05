import { describe, expect, test } from "bun:test";
import {
  DAMAGE_REACTION_MULTIPLIER,
  ZOMBIE_PRESENTATION,
  hitDirection,
} from "./zombiePresentation";
import { enemyIdentity } from "./enemyPresentation";
import type { StageEnemyKind } from "./navigation";

describe("zombie presentation", () => {
  test("defines eight distinct enemy animation profiles", () => {
    const profiles = Object.values(ZOMBIE_PRESENTATION);
    expect(profiles).toHaveLength(8);
    expect(new Set(profiles.map((profile) => profile.name)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.silhouette)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.gait)).size).toBe(8);
    const kinds: StageEnemyKind[] = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(profiles.map((profile) => profile.name)).toEqual(
      kinds.map((kind) => enemyIdentity(kind).name),
    );
    expect(ZOMBIE_PRESENTATION[2].faceZ).toBeGreaterThan(ZOMBIE_PRESENTATION[0].faceZ);
    expect(ZOMBIE_PRESENTATION[5].faceZ).toBeGreaterThan(ZOMBIE_PRESENTATION[0].faceZ);
  });

  test("normalizes hit direction and handles a zero-length source", () => {
    expect(hitDirection(3, 4, 0, 0)).toEqual({ x: 0.6, z: 0.8 });
    expect(hitDirection(0, 0, 0, 0)).toEqual({ x: 0, z: 0 });
  });

  test("keeps heavy and precision attacks visibly stronger than light hits", () => {
    expect(DAMAGE_REACTION_MULTIPLIER["rocket"]!).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER["rifleman"]!);
    expect(DAMAGE_REACTION_MULTIPLIER["sniper"]!).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER["rifleman"]!);
    expect(DAMAGE_REACTION_MULTIPLIER["shotgunner"]!).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER["flamethrower"]!);
    for (const multiplier of Object.values(DAMAGE_REACTION_MULTIPLIER)) {
      expect(Number.isFinite(multiplier)).toBe(true);
      expect(multiplier).toBeGreaterThan(0);
    }
    for (const profile of Object.values(ZOMBIE_PRESENTATION)) {
      expect(Number.isFinite(profile.hitRecoil)).toBe(true);
      expect(profile.hitRecoil).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(profile.deathFold)).toBe(true);
      expect(profile.deathFold).toBeGreaterThan(0);
    }
  });
});
