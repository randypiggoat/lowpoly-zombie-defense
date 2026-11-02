import { describe, expect, test } from "bun:test";
import { TOWER_INFO } from "./engine";
import { getCombatImpactProfile, TOWER_IMPACT_PROFILES } from "./combatVfxDesign";

const EXPECTED_TOWERS = [
  "rifleman",
  "shotgunner",
  "sniper",
  "tesla",
  "flamethrower",
  "freezer",
  "rocket",
  "laser",
] as const;

describe("tower combat impact profiles", () => {
  test("defines a dedicated presentation profile for every tower", () => {
    expect(Object.keys(TOWER_IMPACT_PROFILES).sort()).toEqual([...EXPECTED_TOWERS].sort());
  });

  test("uses the canonical art-direction accent for every tower impact", () => {
    for (const kind of EXPECTED_TOWERS) {
      expect(TOWER_IMPACT_PROFILES[kind].color).toBe(TOWER_INFO[kind].accent);
    }
  });

  test("uses distinct impact colors and readable scale ranges", () => {
    const profiles = EXPECTED_TOWERS.map((kind) => TOWER_IMPACT_PROFILES[kind]);
    expect(new Set(profiles.map((profile) => profile.color)).size).toBe(EXPECTED_TOWERS.length);

    for (const profile of profiles) {
      expect(profile.scale).toBeGreaterThan(0);
      expect(profile.scale).toBeLessThanOrEqual(1.5);
      expect(profile.spread).toBeGreaterThan(0);
      expect(profile.spread).toBeLessThanOrEqual(0.8);
      expect(profile.verticalSpread).toBeGreaterThanOrEqual(0);
      expect(profile.verticalSpread).toBeLessThanOrEqual(0.6);
      expect(profile.ringScaleX).toBeGreaterThan(0);
      expect(profile.ringScaleY).toBeGreaterThan(0);
      expect(Number.isFinite(profile.rotationSpeed)).toBe(true);
    }
  });

  test("gives each attack a bounded and meaningful hit-shard silhouette", () => {
    const profiles = EXPECTED_TOWERS.map((kind) => TOWER_IMPACT_PROFILES[kind]);
    const shardSignatures = profiles.map((profile) => profile.sparkScale.join(":"));

    expect(new Set(shardSignatures).size).toBe(EXPECTED_TOWERS.length);

    for (const profile of profiles) {
      expect(profile.sparkCount).toBeGreaterThanOrEqual(2);
      expect(profile.sparkCount).toBeLessThanOrEqual(4);
      expect(profile.sparkScale).toHaveLength(3);
      for (const axisScale of profile.sparkScale) {
        expect(axisScale).toBeGreaterThan(0);
        expect(axisScale).toBeLessThanOrEqual(3.2);
      }
    }
  });

  test("returns no tower-specific profile when the hit has no known attack source", () => {
    expect(getCombatImpactProfile(null)).toBeNull();
    expect(getCombatImpactProfile(undefined)).toBeNull();
  });
});
