import { describe, expect, test } from "bun:test";
import {
  MAX_RUN_GOLD_MULTIPLIER,
  RUN_MODIFIER_DEFS,
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

  test("reworked modifiers trade one stat for another", () => {
    const get = (id: string) => RUN_MODIFIER_DEFS.find((entry) => entry.id === id)!.effects;
    expect(get("bounty")).toEqual({ goldMultiplier: 1.4, rateMultiplier: 0.85 });
    expect(get("hot-lead")).toEqual({ damageMultiplier: 1.25, goldMultiplier: 1.2, rateMultiplier: 0.8 });
    expect(get("cryo-ammo")).toEqual({ slowMultiplier: 1.45, damageMultiplier: 0.85 });
    expect(get("hot-chamber")).toEqual({ rateMultiplier: 1.5, damageMultiplier: 0.78 });
  });

  test("gold modifiers stack with a cap and cost firepower", () => {
    const effects = getRunModifierEffects(["bounty", "hot-lead", "scavenger"]);
    expect(effects.goldMultiplier).toBe(MAX_RUN_GOLD_MULTIPLIER);
    expect(effects.rateMultiplier).toBeCloseTo(0.85 * 0.8);
  });

  test("hot chamber and cryo ammo combine without a net damage-rate gain", () => {
    const effects = getRunModifierEffects(["hot-chamber", "cryo-ammo"]);
    expect(effects.rateMultiplier).toBeCloseTo(1.5);
    expect(effects.damageMultiplier).toBeCloseTo(0.78 * 0.85);
    expect(effects.slowMultiplier).toBeCloseTo(1.45);
  });
});
