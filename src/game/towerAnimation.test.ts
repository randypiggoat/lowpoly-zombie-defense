import { describe, expect, test } from "bun:test";
import type { TowerKind } from "./engine";
import {
  getTowerAnticipation,
  getTowerShotKick,
  TOWER_ANIMATION_PROFILES,
} from "./towerAnimation";

const towerKinds: TowerKind[] = [
  "rifleman",
  "shotgunner",
  "sniper",
  "tesla",
  "flamethrower",
  "freezer",
  "rocket",
  "laser",
];

describe("tower animation profiles", () => {
  test("covers every tower with a distinct idle cadence and safe numeric profile", () => {
    const profiles = towerKinds.map((kind) => TOWER_ANIMATION_PROFILES[kind]);
    expect(Object.keys(TOWER_ANIMATION_PROFILES).sort()).toEqual([...towerKinds].sort());
    expect(new Set(profiles.map((profile) => profile.idleSpeed)).size).toBe(towerKinds.length);

    for (const profile of profiles) {
      for (const value of Object.values(profile)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(3);
      }
    }
  });

  test("keeps the weapon at rest on the exact projectile-launch frame", () => {
    expect(getTowerShotKick(1)).toBeCloseTo(0);
    expect(getTowerShotKick(Number.NaN)).toBeCloseTo(0);
  });

  test("adds a brief recoil follow-through and settles back to idle", () => {
    expect(getTowerShotKick(0.72)).toBeGreaterThan(0.9);
    expect(getTowerShotKick(0.42)).toBeCloseTo(0);
    expect(getTowerShotKick(0)).toBeCloseTo(0);
    expect(getTowerShotKick(-2)).toBeCloseTo(0);
    expect(getTowerShotKick(2)).toBeCloseTo(0);
  });

  test("anticipates only when a target is present and its shot is near ready", () => {
    expect(getTowerAnticipation(0, false)).toBe(0);
    expect(getTowerAnticipation(0.14, true)).toBeCloseTo(0);
    expect(getTowerAnticipation(0.07, true)).toBeCloseTo(0.5);
    expect(getTowerAnticipation(0, true)).toBe(1);
    expect(getTowerAnticipation(Number.NaN, true)).toBe(1);
  });
});
