import { describe, expect, test } from "bun:test";
import {
  RUN_MODIFIER_DEFS,
  applyRunModifiersToCombat,
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
    expect(effects.singleTargetDamageMultiplier).toBeCloseTo(1.4);
    expect(effects.damageMultiplier).toBeCloseTo(1);
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

  test("pool offers roughly twenty distinct, tradeoff-bearing modifiers", () => {
    expect(RUN_MODIFIER_DEFS.length).toBeGreaterThanOrEqual(24);
    expect(RUN_MODIFIER_DEFS.length).toBeLessThanOrEqual(28);
    expect(new Set(RUN_MODIFIER_DEFS.map((entry) => entry.id)).size).toBe(RUN_MODIFIER_DEFS.length);
    for (const entry of RUN_MODIFIER_DEFS) expect(Object.keys(entry.effects).length).toBeGreaterThan(0);
  });

  const baseCombat = {
    damage: 100, splash: 0, chain: 0, slow: 0, burn: 0, crit: 0, stun: 0,
    markDuration: 0, markBonus: 0, shatterMultiplier: 1, executeThreshold: 0,
    executeMultiplier: 1, bossDamageMultiplier: 1, closeDamageMultiplier: 1,
    stunnedMultiplier: 1, burningMultiplier: 1, killRush: 1, burnSpread: 0,
    eliteDamageMultiplier: 1, precisionMultiplier: 1, fastDamageMultiplier: 1,
  };

  test("role modifiers split single-target and splash towers", () => {
    const effects = getRunModifierEffects(["scattershot"]);
    expect(applyRunModifiersToCombat(baseCombat, effects).damage).toBeCloseTo(85);
    expect(applyRunModifiersToCombat({ ...baseCombat, splash: 1 }, effects).damage).toBeCloseTo(130);
  });

  test("synergy modifiers grant mark, execute, stun and ignite to every tower", () => {
    const effects = getRunModifierEffects(["spotter-net", "execution-order", "shock-rounds", "accelerant", "forked-rounds"]);
    const out = applyRunModifiersToCombat(baseCombat, effects);
    expect(out.markDuration).toBeGreaterThan(0);
    expect(out.executeThreshold).toBeCloseTo(0.18);
    expect(out.executeMultiplier).toBe(2);
    expect(out.stun).toBeGreaterThan(0);
    expect(out.stunnedMultiplier).toBeCloseTo(1.3);
    expect(out.burn).toBeGreaterThan(0);
    expect(out.chain).toBe(1);
  });

  test("hazard pay trades danger for gold", () => {
    const effects = getRunModifierEffects(["hazard-pay"]);
    expect(effects.goldMultiplier).toBeCloseTo(1.5);
    expect(effects.enemyHealthMultiplier).toBeCloseTo(1.2);
  });

  test("boss, close-range, shatter and burn effects combine and respect caps", () => {
    const effects = getRunModifierEffects(["hunter-protocol", "bunker-doctrine", "brittle-frost", "accelerant", "execution-order"]);
    const out = applyRunModifiersToCombat({ ...baseCombat, crit: 0.7, executeThreshold: 0.45, executeMultiplier: 3 }, effects);
    expect(out.bossDamageMultiplier).toBeCloseTo(1.55);
    expect(out.closeDamageMultiplier).toBeCloseTo(1.45);
    expect(out.shatterMultiplier).toBeCloseTo(1.5);
    expect(out.burn).toBe(6);
    expect(out.burningMultiplier).toBeCloseTo(1.2);
    expect(out.executeThreshold).toBe(0.5);
    expect(out.executeMultiplier).toBe(3);
    expect(out.crit).toBe(0.7);
    expect(applyRunModifiersToCombat({ ...baseCombat, crit: 0.7 }, { ...effects, critBonus: 0.2 }).crit).toBe(0.75);
  });

  test("situational modifiers feed the combat stats", () => {
    const effects = getRunModifierEffects(["adrenaline", "wildfire", "pest-control", "eagle-eye", "heavy-hunter"]);
    const out = applyRunModifiersToCombat(baseCombat, effects);
    expect(out.killRush).toBeCloseTo(1.3);
    expect(out.burnSpread).toBeGreaterThan(0);
    expect(out.fastDamageMultiplier).toBeCloseTo(1.45);
    expect(out.precisionMultiplier).toBeCloseTo(1.35);
    expect(out.eliteDamageMultiplier).toBeCloseTo(1.35);
  });

  test("stacked status bonuses are capped", () => {
    const effects = getRunModifierEffects(["shock-rounds"]);
    const out = applyRunModifiersToCombat({ ...baseCombat, stunnedMultiplier: 2.2 }, effects);
    expect(out.stunnedMultiplier).toBeLessThanOrEqual(2.4);
  });
});
