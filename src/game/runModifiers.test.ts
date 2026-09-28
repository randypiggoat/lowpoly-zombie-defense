import { describe, expect, test } from "bun:test";
import {
  createRunModifierOffer,
  getRunModifierEffects,
  shouldOfferRunModifier,
} from "./runModifiers";

describe("run modifiers", () => {
  test("offers every third wave starting at wave 3", () => {
    expect(shouldOfferRunModifier(2)).toBe(false);
    expect(shouldOfferRunModifier(3)).toBe(true);
    expect(shouldOfferRunModifier(6)).toBe(true);
  });

  test("combines active modifiers multiplicatively", () => {
    const effects = getRunModifierEffects(["overcharged", "deadeye"]);
    expect(effects.rateMultiplier).toBeCloseTo(1.17);
    expect(effects.rangeMultiplier).toBeCloseTo(0.85);
    expect(effects.damageMultiplier).toBeCloseTo(1.25);
  });

  test("offer is unique and excludes active modifiers", () => {
    const offer = createRunModifierOffer(() => 0.25, ["overcharged"]);
    expect(offer).toHaveLength(3);
    expect(new Set(offer.map((entry) => entry.id)).size).toBe(3);
    expect(offer.some((entry) => entry.id === "overcharged")).toBe(false);
  });

  test("expanded pool keeps three choices available after several active modifiers", () => {
    const active = ["overcharged", "bounty", "demolition", "deadeye"] as const;
    const offer = createRunModifierOffer(() => 0.42, [...active]);
    expect(offer).toHaveLength(3);
    expect(new Set(offer.map((entry) => entry.id)).size).toBe(3);
    expect(offer.every((entry) => !active.includes(entry.id as typeof active[number]))).toBe(true);
  });
});
