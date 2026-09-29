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
    expect(getTowerUpgradeAbilities("rifleman", 1, 1).markDuration).toBeGreaterThan(0);
    expect(getTowerUpgradeAbilities("freezer", 0, 1).shatterMultiplier).toBeGreaterThan(1);
    expect(TOWER_PATHS.freezer.b.tiers[0]?.ability).toBe("shatter");
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
