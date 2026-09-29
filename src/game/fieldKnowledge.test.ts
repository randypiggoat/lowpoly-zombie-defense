import { describe, expect, test } from "bun:test";
import {
  FIELD_KNOWLEDGE,
  knowledgeUnlocked,
  resolveFieldKnowledgeEffects,
} from "./fieldKnowledge";

describe("Field Knowledge", () => {
  test("starts with one node per branch available", () => {
    const ranks: Record<string, number> = {};
    for (const category of ["ARSENAL", "FIELDCRAFT", "SALVAGE"] as const) {
      const first = FIELD_KNOWLEDGE.find((node) => node.category === category)!;
      expect(knowledgeUnlocked(first, ranks)).toBe(true);
    }
  });

  test("requires the previous node before advancing a branch", () => {
    const nodes = FIELD_KNOWLEDGE.filter((node) => node.category === "ARSENAL");
    const ranks: Record<string, number> = {};
    expect(knowledgeUnlocked(nodes[1]!, ranks)).toBe(false);
    ranks[nodes[0]!.id] = 1;
    expect(knowledgeUnlocked(nodes[1]!, ranks)).toBe(true);
  });

  test("combines only the knowledge that is actually equipped", () => {
    const ranks = {
      "arsenal-calibration": 1,
      "salvage-scanner": 1,
    };
    const effects = resolveFieldKnowledgeEffects(ranks);
    expect(effects.rangeMultiplier).toBeCloseTo(1.04);
    expect(effects.scrapMultiplier).toBeCloseTo(1.08);
    expect(effects.rateMultiplier).toBe(1);
  });
});
