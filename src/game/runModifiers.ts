import type { RandomSource } from "./random";

export type RunModifierId =
  | "overcharged"
  | "bounty"
  | "demolition"
  | "deadeye"
  | "cryo-ammo"
  | "hot-lead"
  | "longshot"
  | "hot-chamber"
  | "shrapnel"
  | "cryo-reserve"
  | "scavenger"
  | "execution-order"
  | "hunter-protocol"
  | "spotter-net"
  | "shock-rounds"
  | "forked-rounds"
  | "accelerant"
  | "brittle-frost"
  | "bunker-doctrine"
  | "hazard-pay"
  | "scattershot";

export type RunModifierTag = "damage" | "control" | "economy" | "range" | "crowd" | "boss" | "synergy";

export type RunModifierEffectSpec = {
  rateMultiplier?: number;
  rangeMultiplier?: number;
  damageMultiplier?: number;
  goldMultiplier?: number;
  splashMultiplier?: number;
  slowMultiplier?: number;
  /** Extra damage to bosses, from every tower. */
  bossDamageMultiplier?: number;
  /** Extra damage to targets within close range of the firing tower. */
  closeDamageMultiplier?: number;
  /** Damage multiplier for towers whose shots splash. */
  splashTowerDamageMultiplier?: number;
  /** Damage multiplier for towers with no splash and no chain. */
  singleTargetDamageMultiplier?: number;
  /** Extra damage taken by stunned targets from every tower. */
  stunnedDamageMultiplier?: number;
  /** Extra damage taken by burning targets from every tower. */
  burningDamageMultiplier?: number;
  /** Multiplier for burn damage over time. */
  burnMultiplier?: number;
  /** Enemy health multiplier — the price of risky economy picks. */
  enemyHealthMultiplier?: number;
  chainBonus?: number;
  stunBonus?: number;
  critBonus?: number;
  /** Every shot marks its target for this many seconds. */
  markDuration?: number;
  markBonus?: number;
  /** Added to every tower's execute threshold; guarantees a finishing multiplier. */
  executeThresholdBonus?: number;
  /** Minimum burn applied by every tower. */
  burnBonus?: number;
  /** Minimum shatter multiplier against slowed targets for every tower. */
  shatterMultiplier?: number;
};

export type RunModifierDefinition = {
  id: RunModifierId;
  name: string;
  description: string;
  tags?: RunModifierTag[];
  effects: RunModifierEffectSpec;
};

export const RUN_MODIFIER_DEFS: RunModifierDefinition[] = [
  { id: "overcharged", name: "Overcharged", description: "+30% fire rate, −15% range", tags: ["damage"], effects: { rateMultiplier: 1.3, rangeMultiplier: 0.85 } },
  { id: "bounty", name: "Blood Money", description: "+35% gold from kills", tags: ["economy"], effects: { goldMultiplier: 1.35 } },
  { id: "demolition", name: "Demolition", description: "+40% splash radius", tags: ["crowd"], effects: { splashMultiplier: 1.4 } },
  {
    id: "deadeye",
    name: "Deadeye",
    description: "+40% damage from single-target towers, −10% fire rate",
    tags: ["damage", "boss"],
    effects: { singleTargetDamageMultiplier: 1.4, rateMultiplier: 0.9 },
  },
  { id: "cryo-ammo", name: "Cryo Ammo", description: "Slow effects are 35% stronger", tags: ["control"], effects: { slowMultiplier: 1.35 } },
  { id: "hot-lead", name: "Hot Lead", description: "+15% damage and +15% gold from kills", tags: ["economy", "damage"], effects: { damageMultiplier: 1.15, goldMultiplier: 1.15 } },
  {
    id: "longshot",
    name: "Longshot",
    description: "+30% range, −18% fire rate",
    tags: ["range"],
    effects: { rangeMultiplier: 1.3, rateMultiplier: 0.82 },
  },
  {
    id: "hot-chamber",
    name: "Hot Chamber",
    description: "+35% fire rate, −8% range",
    tags: ["damage"],
    effects: { rateMultiplier: 1.35, rangeMultiplier: 0.92 },
  },
  {
    id: "shrapnel",
    name: "Shrapnel",
    description: "+35% splash radius, −8% damage",
    tags: ["crowd"],
    effects: { splashMultiplier: 1.35, damageMultiplier: 0.92 },
  },
  {
    id: "cryo-reserve",
    name: "Cryo Reserve",
    description: "+30% slow strength, −8% fire rate",
    tags: ["control"],
    effects: { slowMultiplier: 1.3, rateMultiplier: 0.92 },
  },
  {
    id: "scavenger",
    name: "Scavenger",
    description: "+25% kill gold, −7% damage",
    tags: ["economy"],
    effects: { goldMultiplier: 1.25, damageMultiplier: 0.93 },
  },
  {
    id: "execution-order",
    name: "Execution Order",
    description: "Every tower finishes targets below 18% HP for double damage, −8% damage",
    tags: ["synergy", "damage"],
    effects: { executeThresholdBonus: 0.18, damageMultiplier: 0.92 },
  },
  {
    id: "hunter-protocol",
    name: "Hunter Protocol",
    description: "+55% damage to bosses, −10% damage to everything else",
    tags: ["boss"],
    effects: { bossDamageMultiplier: 1.55, damageMultiplier: 0.9 },
  },
  {
    id: "spotter-net",
    name: "Spotter Net",
    description: "Every shot marks its target (+15% damage taken for 2.5s), −8% damage",
    tags: ["synergy"],
    effects: { markDuration: 2.5, markBonus: 0.15, damageMultiplier: 0.92 },
  },
  {
    id: "shock-rounds",
    name: "Shock Rounds",
    description: "Hits stun briefly and stunned zombies take +30% damage, −10% fire rate",
    tags: ["control", "synergy"],
    effects: { stunBonus: 0.14, stunnedDamageMultiplier: 1.3, rateMultiplier: 0.9 },
  },
  {
    id: "forked-rounds",
    name: "Forked Rounds",
    description: "Every shot chains to +1 extra target, −12% damage",
    tags: ["crowd"],
    effects: { chainBonus: 1, damageMultiplier: 0.88 },
  },
  {
    id: "accelerant",
    name: "Accelerant",
    description: "Every shot ignites; burning zombies take +20% damage. −8% damage",
    tags: ["synergy", "crowd"],
    effects: { burnBonus: 6, burningDamageMultiplier: 1.2, damageMultiplier: 0.92 },
  },
  {
    id: "brittle-frost",
    name: "Brittle Frost",
    description: "Slowed zombies shatter for +50% damage from every tower, +10% slow, −6% fire rate",
    tags: ["control", "synergy"],
    effects: { shatterMultiplier: 1.5, slowMultiplier: 1.1, rateMultiplier: 0.94 },
  },
  {
    id: "bunker-doctrine",
    name: "Bunker Doctrine",
    description: "+45% damage at close range, −15% range",
    tags: ["damage"],
    effects: { closeDamageMultiplier: 1.45, rangeMultiplier: 0.85 },
  },
  {
    id: "hazard-pay",
    name: "Hazard Pay",
    description: "+50% kill gold, but zombies have +20% health",
    tags: ["economy"],
    effects: { goldMultiplier: 1.5, enemyHealthMultiplier: 1.2 },
  },
  {
    id: "scattershot",
    name: "Scattershot",
    description: "+30% damage from splash towers, −15% from single-target towers",
    tags: ["crowd"],
    effects: { splashTowerDamageMultiplier: 1.3, singleTargetDamageMultiplier: 0.85 },
  },
];

export type RunModifierEffects = {
  rateMultiplier: number;
  rangeMultiplier: number;
  damageMultiplier: number;
  goldMultiplier: number;
  splashMultiplier: number;
  slowMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  splashTowerDamageMultiplier: number;
  singleTargetDamageMultiplier: number;
  stunnedDamageMultiplier: number;
  burningDamageMultiplier: number;
  burnMultiplier: number;
  enemyHealthMultiplier: number;
  chainBonus: number;
  stunBonus: number;
  critBonus: number;
  markDuration: number;
  markBonus: number;
  executeThresholdBonus: number;
  burnBonus: number;
  shatterMultiplier: number;
};

const MULTIPLICATIVE_EFFECTS = [
  "rateMultiplier",
  "rangeMultiplier",
  "damageMultiplier",
  "goldMultiplier",
  "splashMultiplier",
  "slowMultiplier",
  "bossDamageMultiplier",
  "closeDamageMultiplier",
  "splashTowerDamageMultiplier",
  "singleTargetDamageMultiplier",
  "stunnedDamageMultiplier",
  "burningDamageMultiplier",
  "burnMultiplier",
  "enemyHealthMultiplier",
] as const;
const ADDITIVE_EFFECTS = ["chainBonus", "stunBonus", "critBonus", "executeThresholdBonus"] as const;
const MAX_EFFECTS = ["markDuration", "markBonus", "burnBonus", "shatterMultiplier"] as const;

export function getRunModifierEffects(ids: RunModifierId[]): RunModifierEffects {
  const effects: RunModifierEffects = {
    rateMultiplier: 1,
    rangeMultiplier: 1,
    damageMultiplier: 1,
    goldMultiplier: 1,
    splashMultiplier: 1,
    slowMultiplier: 1,
    bossDamageMultiplier: 1,
    closeDamageMultiplier: 1,
    splashTowerDamageMultiplier: 1,
    singleTargetDamageMultiplier: 1,
    stunnedDamageMultiplier: 1,
    burningDamageMultiplier: 1,
    burnMultiplier: 1,
    enemyHealthMultiplier: 1,
    chainBonus: 0,
    stunBonus: 0,
    critBonus: 0,
    markDuration: 0,
    markBonus: 0,
    executeThresholdBonus: 0,
    burnBonus: 0,
    shatterMultiplier: 1,
  };

  for (const id of ids) {
    const definition = RUN_MODIFIER_DEFS.find((entry) => entry.id === id);
    if (!definition) continue;
    const mods = definition.effects;
    for (const key of MULTIPLICATIVE_EFFECTS) {
      const value = mods[key];
      if (value) effects[key] *= value;
    }
    for (const key of ADDITIVE_EFFECTS) {
      const value = mods[key];
      if (value) effects[key] += value;
    }
    for (const key of MAX_EFFECTS) {
      const value = mods[key];
      if (value) effects[key] = Math.max(effects[key], value);
    }
  }

  return effects;
}

export type RunModifierCombatInput = {
  damage: number;
  splash: number;
  chain: number;
  slow: number;
  burn: number;
  crit: number;
  stun: number;
  markDuration: number;
  markBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  stunnedMultiplier: number;
  burningMultiplier: number;
};

/** Folds run modifiers into one tower's combat stats so every shot picks up build-shaping effects. */
export function applyRunModifiersToCombat<T extends RunModifierCombatInput>(
  combat: T,
  effects: RunModifierEffects,
): T {
  const role =
    combat.splash > 0
      ? effects.splashTowerDamageMultiplier
      : combat.chain <= 0
        ? effects.singleTargetDamageMultiplier
        : 1;
  const executeThreshold = Math.min(0.5, combat.executeThreshold + effects.executeThresholdBonus);
  return {
    ...combat,
    damage: combat.damage * effects.damageMultiplier * role,
    splash: combat.splash * effects.splashMultiplier,
    chain: combat.chain + effects.chainBonus,
    slow: combat.slow * effects.slowMultiplier,
    burn: Math.max(combat.burn, effects.burnBonus) * effects.burnMultiplier,
    crit: Math.min(0.75, combat.crit + effects.critBonus),
    stun: Math.max(combat.stun, effects.stunBonus),
    markDuration: Math.max(combat.markDuration, effects.markDuration),
    markBonus: Math.max(combat.markBonus, effects.markBonus),
    shatterMultiplier: Math.max(combat.shatterMultiplier, effects.shatterMultiplier),
    executeThreshold,
    executeMultiplier: executeThreshold > 0 ? Math.max(combat.executeMultiplier, 2) : combat.executeMultiplier,
    bossDamageMultiplier: combat.bossDamageMultiplier * effects.bossDamageMultiplier,
    closeDamageMultiplier: combat.closeDamageMultiplier * effects.closeDamageMultiplier,
    stunnedMultiplier: combat.stunnedMultiplier * effects.stunnedDamageMultiplier,
    burningMultiplier: combat.burningMultiplier * effects.burningDamageMultiplier,
  };
}

export function createRunModifierOffer(
  random: RandomSource,
  active: RunModifierId[],
  count = 3,
): RunModifierDefinition[] {
  const available = RUN_MODIFIER_DEFS.filter((entry) => !active.includes(entry.id));
  const pool = [...available];
  const offer: RunModifierDefinition[] = [];

  while (pool.length > 0 && offer.length < Math.min(count, available.length)) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    offer.push(pool.splice(index, 1)[0]!);
  }

  return offer;
}

export function shouldOfferRunModifier(wave: number) {
  return wave >= 3 && wave % 3 === 0;
}
