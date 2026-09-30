import { describe, expect, test } from "bun:test";
import {
  DAMAGE_REACTION_MULTIPLIER,
  ZOMBIE_PRESENTATION,
  hitDirection,
} from "./zombiePresentation";

describe("zombie presentation", () => {
  test("defines eight distinct enemy animation profiles", () => {
    const profiles = Object.values(ZOMBIE_PRESENTATION);
    expect(profiles).toHaveLength(8);
    expect(new Set(profiles.map((profile) => profile.name)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.silhouette)).size).toBe(8);
    expect(new Set(profiles.map((profile) => profile.gait)).size).toBe(8);
    expect(ZOMBIE_PRESENTATION[2].faceZ).toBeGreaterThan(ZOMBIE_PRESENTATION[0].faceZ);
    expect(ZOMBIE_PRESENTATION[5].faceZ).toBeGreaterThan(ZOMBIE_PRESENTATION[0].faceZ);
  });

  test("normalizes hit direction and handles a zero-length source", () => {
    expect(hitDirection(3, 4, 0, 0)).toEqual({ x: 0.6, z: 0.8 });
    expect(hitDirection(0, 0, 0, 0)).toEqual({ x: 0, z: 0 });
  });

  test("keeps heavy and precision attacks visibly stronger than light hits", () => {
    expect(DAMAGE_REACTION_MULTIPLIER.rocket).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER.rifleman);
    expect(DAMAGE_REACTION_MULTIPLIER.sniper).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER.rifleman);
    expect(DAMAGE_REACTION_MULTIPLIER.shotgunner).toBeGreaterThan(DAMAGE_REACTION_MULTIPLIER.flamethrower);
  });
});
