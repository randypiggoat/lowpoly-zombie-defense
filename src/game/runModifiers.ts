import type { RandomSource } from "./random";

export type RunModifierId =
  | "overcharged"
  | "bounty"
  | "demolition"
  | "deadeye"
  | "cryo-ammo"
  | "hot-lead";

export type RunModifierDefinition = {
  id: RunModifierId;
  name: string;
  description: string;
  effects: {
    rateMultiplier?: number;
    rangeMultiplier?: number;
    damageMultiplier?: number;
    goldMultiplier?: number;
    splashMultiplier?: number;
    slowMultiplier?: number;
  };
};

export const RUN_MODIFIER_DEFS: RunModifierDefinition[] = [
  { id: "overcharged", name: "Overcharged", description: "+30% fire rate, −15% range", effects: { rateMultiplier: 1.3, rangeMultiplier: 0.85 } },
  { id: "bounty", name: "Blood Money", description: "+35% gold from kills", effects: { goldMultiplier: 1.35 } },
  { id: "demolition", name: "Demolition", description: "+40% splash radius", effects: { splashMultiplier: 1.4 } },
  { id: "deadeye", name: "Deadeye", description: "+25% damage, −10% fire rate", effects: { damageMultiplier: 1.25, rateMultiplier: 0.9 } },
  { id: "cryo-ammo", name: "Cryo Ammo", description: "Slow effects are 35% stronger", effects: { slowMultiplier: 1.35 } },
  { id: "hot-lead", name: "Hot Lead", description: "+15% damage and +15% gold from kills", effects: { damageMultiplier: 1.15, goldMultiplier: 1.15 } },
  {
    id: "longshot",
    name: "Longshot",
    description: "+30% range, −18% fire rate",
    effects: { rangeMultiplier: 1.3, rateMultiplier: 0.82 },
  },
  {
    id: "hot-chamber",
    name: "Hot Chamber",
    description: "+35% fire rate, −8% range",
    effects: { rateMultiplier: 1.35, rangeMultiplier: 0.92 },
  },
  {
    id: "shrapnel",
    name: "Shrapnel",
    description: "+35% splash radius, −8% damage",
    effects: { splashMultiplier: 1.35, damageMultiplier: 0.92 },
  },
  {
    id: "cryo-reserve",
    name: "Cryo Reserve",
    description: "+30% slow strength, −8% fire rate",
    effects: { slowMultiplier: 1.3, rateMultiplier: 0.92 },
  },
  {
    id: "scavenger",
    name: "Scavenger",
    description: "+25% kill gold, −7% damage",
    effects: { goldMultiplier: 1.25, damageMultiplier: 0.93 },
  },
  {
    id: "execution-order",
    name: "Execution Order",
    description: "+22% damage, −10% range",
    effects: { damageMultiplier: 1.22, rangeMultiplier: 0.9 },
  },
];

export type RunModifierEffects = {
  rateMultiplier: number;
  rangeMultiplier: number;
  damageMultiplier: number;
  goldMultiplier: number;
  splashMultiplier: number;
  slowMultiplier: number;
};

export function getRunModifierEffects(ids: RunModifierId[]): RunModifierEffects {
  const effects: RunModifierEffects = {
    rateMultiplier: 1,
    rangeMultiplier: 1,
    damageMultiplier: 1,
    goldMultiplier: 1,
    splashMultiplier: 1,
    slowMultiplier: 1,
  };

  for (const id of ids) {
    const definition = RUN_MODIFIER_DEFS.find((entry) => entry.id === id);
    if (!definition) continue;
    const mods = definition.effects;
    if (mods.rateMultiplier) effects.rateMultiplier *= mods.rateMultiplier;
    if (mods.rangeMultiplier) effects.rangeMultiplier *= mods.rangeMultiplier;
    if (mods.damageMultiplier) effects.damageMultiplier *= mods.damageMultiplier;
    if (mods.goldMultiplier) effects.goldMultiplier *= mods.goldMultiplier;
    if (mods.splashMultiplier) effects.splashMultiplier *= mods.splashMultiplier;
    if (mods.slowMultiplier) effects.slowMultiplier *= mods.slowMultiplier;
  }

  return effects;
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
