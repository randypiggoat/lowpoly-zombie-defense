import { describe, expect, test } from "bun:test";
import {
  DAMAGE_REACTION_MULTIPLIER,
  ZOMBIE_ARCHETYPE_PALETTES,
  ZOMBIE_PRESENTATION,
  hitDirection,
  zombieHitAmount,
  zombieModelScale,
  zombiePaletteForKind,
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

  test("defines distinct bounded locomotion and impact accents for every archetype", () => {
    const profiles = Object.values(ZOMBIE_PRESENTATION);
    const motionFields = [
      "stepLift",
      "torsoTwist",
      "armAsymmetry",
      "bodyPulse",
      "idleJitter",
      "hitStagger",
      "hitSideRoll",
      "deathTwist",
    ] as const;

    for (const profile of profiles) {
      for (const field of motionFields) {
        expect(Number.isFinite(profile[field])).toBe(true);
        expect(profile[field]).toBeGreaterThanOrEqual(0);
      }
      expect(profile.stepLift).toBeLessThanOrEqual(0.2);
      expect(profile.hitStagger).toBeLessThanOrEqual(0.25);
      expect(profile.deathTwist).toBeLessThanOrEqual(0.5);
    }

    expect(new Set(profiles.map((profile) => profile.stepLift)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.bodyPulse)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.hitStagger)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.deathTwist)).size).toBe(8);
    expect(ZOMBIE_PRESENTATION[1].stepLift).toBeGreaterThan(ZOMBIE_PRESENTATION[2].stepLift);
    expect(ZOMBIE_PRESENTATION[2].hitStagger).toBeLessThan(ZOMBIE_PRESENTATION[1].hitStagger);
    expect(ZOMBIE_PRESENTATION[4].bodyPulse).toBeGreaterThan(ZOMBIE_PRESENTATION[0].bodyPulse);
    expect(ZOMBIE_PRESENTATION[7].hitSideRoll).toBeGreaterThan(ZOMBIE_PRESENTATION[5].hitSideRoll);
  });

  test("keeps archetype scale deterministic and applies the boss multiplier once", () => {
    const expected: Record<StageEnemyKind, number> = {
      0: 1,
      1: 0.88,
      2: 1.24,
      3: 1.02,
      4: 1.06,
      5: 1.18,
      6: 0.9,
      7: 0.72,
    };
    const kinds: StageEnemyKind[] = [0, 1, 2, 3, 4, 5, 6, 7];
    for (const kind of kinds) {
      expect(zombieModelScale(kind)).toBe(expected[kind]);
      expect(zombieModelScale(kind, true)).toBeCloseTo(expected[kind] * 1.16);
    }
  });

  test("normalizes hit direction and handles a zero-length source", () => {
    expect(hitDirection(3, 4, 0, 0)).toEqual({ x: 0.6, z: 0.8 });
    expect(hitDirection(0, 0, 0, 0)).toEqual({ x: 0, z: 0 });
  });

  test("clamps hit animation and reduces its intensity for reduced motion", () => {
    expect(zombieHitAmount(-0.2)).toBe(0);
    expect(zombieHitAmount(0.5)).toBe(0.5);
    expect(zombieHitAmount(2)).toBe(1);
    expect(zombieHitAmount(0.5, true)).toBe(0.175);
    expect(zombieHitAmount(Number.NaN)).toBe(0);
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

  test("keeps archetype colors distinct by default and lets earned skins override them", () => {
    const defaultSkin = {
      id: "zombie-default",
      skin: "#6f9f55",
      cloth: "#42513f",
      legs: "#35404a",
    };
    const kinds: StageEnemyKind[] = [0, 1, 2, 3, 4, 5, 6, 7];
    const palettes = kinds.map((kind) => zombiePaletteForKind(kind, defaultSkin));

    expect(palettes).toEqual(kinds.map((kind) => ZOMBIE_ARCHETYPE_PALETTES[kind]));
    expect(new Set(palettes.map((palette) => palette.skin)).size).toBe(8);

    const earnedSkin = {
      id: "zombie-nightfall",
      skin: "#536f63",
      cloth: "#28333a",
      legs: "#202932",
    };
    expect(zombiePaletteForKind(7, earnedSkin)).toEqual(earnedSkin);
  });
});
