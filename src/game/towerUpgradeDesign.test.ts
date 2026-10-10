import { describe, expect, test } from "bun:test";
import { FIELD_KNOWLEDGE, resolveFieldKnowledgeEffects, knowledgeUnlocked } from "./fieldKnowledge";
import { TOWER_PATHS, getTowerUpgradeAbilities } from "./towerUpgradeDesign";

describe("tower upgrade design", () => {
  test("every tower offers two distinct identities", () => {
    for (const [kind, paths] of Object.entries(TOWER_PATHS)) {
      expect(paths.a.name).not.toBe(paths.b.name);
      expect(paths.a.tiers).toHaveLength(4);
      expect(paths.b.tiers).toHaveLength(4);
      expect(kind).toBeTruthy();
    }
  });

  test("behavior abilities unlock at named tiers", () => {
    expect(getTowerUpgradeAbilities("rifleman", 0, 1).volley).toBe(2);
    expect(getTowerUpgradeAbilities("rifleman", 0, 1).markBonus).toBeGreaterThan(0);
    expect(TOWER_PATHS.freezer.b.tiers[0]?.ability).toBe("mark");
    expect(getTowerUpgradeAbilities("freezer", 2, 0).shatterMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("rocket", 0, 1).markBonus).toBeGreaterThan(0);
  });
});

describe("behavioral upgrades", () => {
  test("new abilities change how towers are used", () => {
    expect(getTowerUpgradeAbilities("rifleman", 0, 4).volley).toBe(3);
    expect(getTowerUpgradeAbilities("rifleman", 0, 4).squadRateBonus).toBeCloseTo(0.15);
    expect(getTowerUpgradeAbilities("rifleman", 0, 4).squadRadius).toBeGreaterThan(5);
    expect(getTowerUpgradeAbilities("tesla", 0, 3).stun).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("tesla", 4, 0).stunnedMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("flamethrower", 2, 0).burningMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("flamethrower", 3, 0).swarmMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("flamethrower", 4, 0).executeThreshold).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("rocket", 3, 0).swarmMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("freezer", 0, 3).markSpreadRadius).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("laser", 0, 3).burningMultiplier).toBeGreaterThan(1);
  });
});

describe("second-wave behaviors", () => {
  test("new situational abilities unlock at their tiers", () => {
    expect(getTowerUpgradeAbilities("rifleman", 1, 0).precisionMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("rifleman", 0, 2).markBonus).toBeGreaterThan(0.12);
    expect(getTowerUpgradeAbilities("shotgunner", 1, 0).fastDamageMultiplier).toBeGreaterThan(1);
    expect(getTowerUpgradeAbilities("sniper", 0, 3).markSpreadRadius).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("tesla", 1, 0).chainEscalation).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("flamethrower", 0, 2).burnSpread).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("laser", 0, 1).chainEscalation).toBeGreaterThan(0);
  });

  test("support paths expose real teamwork or crowd-control mechanics", () => {
    for (const [kind, paths] of Object.entries(TOWER_PATHS)) {
      expect(paths.b.focus.length).toBeGreaterThan(10);
      expect(paths.b.tiers.every((entry) => entry.desc.length > 20)).toBe(true);
      expect(paths.b.tiers.some((entry) => entry.ability !== undefined)).toBe(true);
      expect(kind).toBeTruthy();
    }
    const squad = getTowerUpgradeAbilities("rifleman", 0, 4);
    expect(squad.squadRateBonus).toBeLessThanOrEqual(0.15);
    expect(squad.markBonus).toBeLessThanOrEqual(0.22);
    expect(squad.markSpreadRadius).toBeGreaterThan(0);
  });

  test("every tower has at least one behavioral ability in each path", () => {
    for (const paths of Object.values(TOWER_PATHS)) {
      for (const path of [paths.a, paths.b]) {
        expect(path.tiers.some((entry) => "ability" in entry && entry.ability)).toBe(true);
      }
    }
  });
});

describe("field knowledge", () => {
  test("knowledge forms three readable prerequisite branches", () => {
    for (const category of ["ARSENAL", "FIELDCRAFT", "SALVAGE"] as const) {
      const nodes = FIELD_KNOWLEDGE.filter((node) => node.category === category);
      expect(nodes).toHaveLength(4);
      expect(nodes[0]?.prerequisite).toBeUndefined();
      expect(nodes.slice(1).every((node) => typeof node.prerequisite === "string")).toBe(true);
    }
  });

  test("permanent knowledge composes without touching tower-specific upgrade state", () => {
    const effects = resolveFieldKnowledgeEffects({
      "arsenal-calibration": 1,
      "arsenal-overclock": 1,
      "salvage-scanner": 1,
      "salvage-rig": 1,
    });
    expect(effects.rangeMultiplier).toBeGreaterThan(1);
    expect(effects.rateMultiplier).toBeGreaterThan(1);
    expect(effects.scrapMultiplier).toBeGreaterThan(1);
  });

  test("prerequisites gate later knowledge nodes", () => {
    const target = FIELD_KNOWLEDGE.find((node) => node.id === "arsenal-overclock")!;
    expect(knowledgeUnlocked(target, {})).toBe(false);
    expect(knowledgeUnlocked(target, { "arsenal-calibration": 1 })).toBe(true);
  });
});
