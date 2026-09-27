import { describe, expect, test } from "bun:test";
import { getTowerCombatStats, getTowerMods } from "./towerStats";
import type { TowerPathTiers } from "./towerStatsTypes";

const paths: TowerPathTiers = {
  a: {
    tiers: [
      { mods: { dmg: 2, range: 1.5, crit: 0.2, splash: 0.4, burn: 3 } },
      { mods: { dmg: 1.5, slow: 0.6, gore: 2 } },
    ],
  },
  b: {
    tiers: [
      { mods: { rate: 1.4, chain: 1, gold: 1.25 } },
      { mods: { rate: 1.5, crit: 0.35 } },
    ],
  },
};

const definition = {
  damage: 10,
  rate: 2,
  range: 6,
  slow: 0.25,
  splash: 1,
  chain: 2,
  burn: 5,
};

const profileBonus = {
  level: 0,
  damage: 1,
  rate: 1,
  range: 1,
};

describe("tower stat calculations", () => {
  test("combines upgrade modifiers using the existing stacking rules", () => {
    expect(
      getTowerMods({ kind: "test", a: 2, b: 2 }, paths),
    ).toEqual({
      dmg: 3,
      rate: 2.1,
      range: 1.5,
      slow: 0.6,
      splash: 0.4,
      chain: 1,
      crit: 0.35,
      gold: 1.25,
      gore: 2,
      burn: 3,
    });
  });

  test("applies level scaling and profile bonuses to combat stats", () => {
    const stats = getTowerCombatStats(
      { kind: "test", level: 3, a: 1, b: 1 },
      definition,
      paths,
      {
        level: 2,
        damage: 1.2,
        rate: 1.1,
        range: 1.04,
      },
    );

    expect(stats.damage).toBeCloseTo(10 * 2 * 1.22 ** 2 * 1.2);
    expect(stats.rate).toBeCloseTo(2 * 1.4 * 1.06 ** 2 * 1.1);
    expect(stats.range).toBeCloseTo(6 * 1.5 * 1.035 ** 2 * 1.04);
    expect(stats.slow).toBe(0.6);
    expect(stats.splash).toBe(1.4);
    expect(stats.chain).toBe(3);
    expect(stats.burn).toBeCloseTo(5 * 1.22 ** 2 * 1.2);
    expect(stats.crit).toBe(0.2);
    expect(stats.gore).toBe(2);
    expect(stats.gold).toBe(1.25);
  });

  test("preserves base tower stats when no upgrades are purchased", () => {
    const stats = getTowerCombatStats(
      { kind: "test", level: 1, a: 0, b: 0 },
      definition,
      paths,
      profileBonus,
    );

    expect(stats).toEqual({
      damage: 10,
      rate: 2,
      range: 6,
      slow: 0.25,
      splash: 1,
      chain: 2,
      burn: 5,
      crit: 0,
      gore: 1,
      gold: 1,
    });
  });
});
