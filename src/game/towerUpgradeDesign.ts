export type UpgradeAbility =
  | "burst"
  | "stun"
  | "mark"
  | "shatter"
  | "execute"
  | "boss-hunter"
  | "close-range"
  | "burn-duration";

export type UpgradeTier = {
  name: string;
  desc: string;
  cost: number;
  mods: {
    dmg?: number;
    rate?: number;
    range?: number;
    slow?: number;
    splash?: number;
    chain?: number;
    crit?: number;
    gold?: number;
    gore?: number;
    burn?: number;
  };
  ability?: UpgradeAbility;
};

export type UpgradePath = {
  name: string;
  focus: string;
  tiers: [UpgradeTier, UpgradeTier, UpgradeTier, UpgradeTier];
};

const tier = (
  name: string,
  desc: string,
  cost: number,
  mods: UpgradeTier["mods"],
  ability?: UpgradeAbility,
): UpgradeTier => ({ name, desc, cost, mods, ability });

export const TOWER_PATHS = {
  rifleman: {
    a: {
      name: "RECON",
      focus: "Mark threats and own long sightlines",
      tiers: [
        tier("Scout Optic", "Longer sightline; the Rifleman learns to watch the map.", 45, { range: 1.14 }),
        tier("Threat Paint", "First hit marks the target; marked zombies take +12% damage.", 95, { range: 1.08 }, "mark"),
        tier("Piercing Round", "Shots jump to one nearby target after impact.", 220, { chain: 1 }, "mark"),
        tier("Deadeye", "Marked targets below 20% health are finished by a heavy critical hit.", 500, { crit: 0.3, gore: 1.4 }, "execute"),
      ],
    },
    b: {
      name: "SUSTAINED FIRE",
      focus: "Turn one rifle into a firing lane",
      tiers: [
        tier("Double Tap", "Each attack fires a second round at reduced power.", 50, {}, "burst"),
        tier("Fast Magazine", "Shorter cycle between volleys.", 105, { rate: 1.28 }),
        tier("Suppressing Burst", "Burst rounds briefly disrupt the target.", 235, { rate: 1.12 }, "stun"),
        tier("Overwatch", "Three-round volleys turn long sightlines into kill lanes.", 520, { rate: 1.16, dmg: 1.12 }, "burst"),
      ],
    },
  },
  shotgunner: {
    a: {
      name: "RIOT",
      focus: "Widen the kill zone and punish crowds",
      tiers: [
        tier("Wide Choke", "Broader impact zone makes tight bends dangerous.", 55, { splash: 0.72 }),
        tier("Buckshot", "Each blast throws a second close-range shell.", 120, { dmg: 1.18 }, "burst"),
        tier("Dragon Breath", "Pellets ignite anything they touch.", 270, { burn: 10 }, undefined),
        tier("Riot Storm", "Point-blank volleys shred packed lanes.", 560, { splash: 0.9, gore: 2.1 }, "burst"),
      ],
    },
    b: {
      name: "BREACH",
      focus: "Turn close contact into execution range",
      tiers: [
        tier("Concussion Shell", "Impact briefly stuns targets.", 60, { dmg: 1.08 }, "stun"),
        tier("Heavy Buck", "Stronger when fired from a tight defensive pocket.", 130, { dmg: 1.22 }, "close-range"),
        tier("Breaker", "Close hits can finish badly wounded elites.", 290, { crit: 0.2 }, "execute"),
        tier("Gore Cannon", "The whole blast becomes a close-range finishing tool.", 620, { dmg: 1.35, gore: 2.6 }, "close-range"),
      ],
    },
  },
  sniper: {
    a: {
      name: "OVERWATCH",
      focus: "Own the map from one premium perch",
      tiers: [
        tier("Longwatch", "Reach farther lanes from a single position.", 85, { range: 1.24 }),
        tier("Spotter Scope", "First shot marks priority targets for the whole defense.", 190, { range: 1.08 }, "mark"),
        tier("Wall-Piercer", "A shot can jump to a nearby follow-up target.", 390, { chain: 1 }, "mark"),
        tier("God's Eye", "Marked targets below 25% health become execution candidates.", 820, { crit: 0.35, range: 1.12, gore: 1.8 }, "execute"),
      ],
    },
    b: {
      name: "ANTI-MATERIEL",
      focus: "Specialize against dangerous heavy units",
      tiers: [
        tier("Heavy Caliber", "Big targets feel every round.", 90, { dmg: 1.18 }, "boss-hunter"),
        tier("Breaker Tip", "Heavy rounds briefly disrupt armored threats.", 205, { dmg: 1.12 }, "stun"),
        tier("Blast Tip", "Impact splashes the nearest body.", 420, { splash: 1.4 }),
        tier("Brute Breaker", "Heavy targets take a brutal finishing multiplier.", 900, { dmg: 1.4, gore: 2.4 }, "boss-hunter"),
      ],
    },
  },
  tesla: {
    a: {
      name: "CHAIN COIL",
      focus: "Turn crowds into a connected circuit",
      tiers: [
        tier("Extra Arc", "Arc one additional target.", 95, { chain: 1 }),
        tier("Conductors", "Arcs reach a wider pocket.", 195, { range: 1.2, chain: 1 }),
        tier("Storm Net", "Arcs briefly stun secondary targets.", 390, { chain: 2 }, "stun"),
        tier("Tempest", "The entire circuit becomes a multi-target lockdown.", 820, { chain: 2, range: 1.25 }, "stun"),
      ],
    },
    b: {
      name: "OVERLOAD",
      focus: "Build a boss killer that spikes hard",
      tiers: [
        tier("Charged Core", "Heavy current bites deeper into elites.", 90, { dmg: 1.22 }, "boss-hunter"),
        tier("Arc Furnace", "Big discharges briefly stagger the target.", 195, { dmg: 1.12 }, "stun"),
        tier("Critical Surge", "A charged discharge can spike into a critical.", 400, { crit: 0.25 }),
        tier("Annihilator", "Elites and bosses take a devastating bonus.", 840, { dmg: 1.4, gore: 3 }, "boss-hunter"),
      ],
    },
  },
  flamethrower: {
    a: {
      name: "INFERNO",
      focus: "Make burn damage persist through the horde",
      tiers: [
        tier("Hot Fuel", "Burns persist longer after the first hit.", 65, { burn: 5 }, "burn-duration"),
        tier("Sticky Napalm", "Burning targets stay aflame longer.", 145, { burn: 7, splash: 0.45 }, "burn-duration"),
        tier("Firestorm", "A wider cone spreads heat through the pack.", 310, { range: 1.2, splash: 0.55 }),
        tier("Hellmouth", "Deep burn turns crowded lanes into a moving furnace.", 650, { burn: 14, splash: 0.65, gore: 2.2 }, "burn-duration"),
      ],
    },
    b: {
      name: "PRESSURE",
      focus: "Own the short lane with crowd control",
      tiers: [
        tier("Wide Cone", "Make the nozzle cover a larger bend.", 70, { splash: 0.65, range: 1.1 }),
        tier("Scald", "Flame briefly slows burning targets.", 150, { burn: 5 }, "stun"),
        tier("Twin Nozzles", "A hotter stream hits in two quick pulses.", 320, { dmg: 1.18, rate: 1.15 }, "burst"),
        tier("Purifier", "Close-range flame power becomes a lane-clearing burst.", 680, { dmg: 1.3, splash: 0.95, rate: 1.12 }, "close-range"),
      ],
    },
  },
  freezer: {
    a: {
      name: "DEEP FREEZE",
      focus: "Turn space into a controlled slow zone",
      tiers: [
        tier("Chill Mist", "Slows a wider pocket around each impact.", 60, { slow: 0.42, splash: 0.7 }),
        tier("Wide Nozzle", "Extends the freeze pocket into another lane.", 135, { range: 1.2, splash: 0.7 }),
        tier("Cryo Core", "Freeze waves linger with stronger control.", 280, { slow: 0.58, rate: 1.12 }),
        tier("Absolute Zero", "A huge freeze pulse can halt the most dangerous crowd.", 590, { slow: 0.7, splash: 1.2, range: 1.18 }, "stun"),
      ],
    },
    b: {
      name: "SHATTER",
      focus: "Convert slowed zombies into brittle targets",
      tiers: [
        tier("Ice Shards", "Frozen flesh takes a heavier hit.", 65, { dmg: 1.2 }, "shatter"),
        tier("Frostbite", "Brittle targets can spike into critical damage.", 145, { crit: 0.18 }, "shatter"),
        tier("Brittle Bones", "Shatter damage jumps again when the target is slowed.", 300, { dmg: 1.22 }, "shatter"),
        tier("Shatterstorm", "Killing a brittle target sends a violent final burst.", 620, { dmg: 1.28, gore: 2.3, splash: 0.7 }, "shatter"),
      ],
    },
  },
  rocket: {
    a: {
      name: "SIEGE ARTILLERY",
      focus: "Shape the blast zone and slow the route",
      tiers: [
        tier("Long Gun", "Reach the next bend from a safer perch.", 75, { range: 1.2 }),
        tier("Tar Shells", "Explosions leave the wave crawling.", 160, { slow: 0.32, splash: 0.4 }),
        tier("Cluster Shot", "The blast breaks into a wider crowd hit.", 320, { splash: 1.15 }),
        tier("Bombardier", "Large shells dominate long sightlines and bends.", 690, { range: 1.25, splash: 1.2, slow: 0.5 }, "stun"),
      ],
    },
    b: {
      name: "WARHEAD",
      focus: "Make every shell matter against elites",
      tiers: [
        tier("Packed Powder", "The closer the target, the harder the impact.", 80, { dmg: 1.15 }, "close-range"),
        tier("Concussion Warhead", "Direct impacts briefly stagger enemies.", 170, { dmg: 1.08 }, "stun"),
        tier("Bunker Buster", "Heavy targets take a large finishing hit.", 350, { dmg: 1.25 }, "boss-hunter"),
        tier("Meat Grinder", "Close explosive hits become elite-killing finishers.", 740, { dmg: 1.35, rate: 1.18, gore: 2.7 }, "execute"),
      ],
    },
  },
  laser: {
    a: {
      name: "FOCUS ARRAY",
      focus: "Concentrate power into one doomed target",
      tiers: [
        tier("Tight Beam", "Focused contact bites harder.", 160, { dmg: 1.18 }),
        tier("Prism Lens", "Priority targets become marked for follow-up shots.", 340, { dmg: 1.12 }, "mark"),
        tier("Fusion Core", "The beam is tuned for elite targets.", 680, { range: 1.18, dmg: 1.2 }, "boss-hunter"),
        tier("Deathray", "Low-health marked targets are vaporized.", 1320, { dmg: 1.45, crit: 0.28, gore: 3 }, "execute"),
      ],
    },
    b: {
      name: "SCATTER OPTICS",
      focus: "Turn a beam into chain pressure",
      tiers: [
        tier("Beam Splitter", "The beam jumps to one nearby body.", 155, { chain: 1 }),
        tier("Refraction", "The beam can keep bouncing.", 330, { chain: 2, range: 1.12 }),
        tier("Thermal Bloom", "Refractions ignite the crowd.", 650, { burn: 14, splash: 0.5 }),
        tier("Starfall", "A cascade of chained pulses clears packed lanes.", 1280, { chain: 3, dmg: 1.22, rate: 1.12 }, "burst"),
      ],
    },
  },
} as const;

export type TowerKindKey = keyof typeof TOWER_PATHS;

export type TowerUpgradeAbilities = {
  volley: number;
  stun: number;
  markDuration: number;
  markBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
};

const EMPTY_ABILITIES: TowerUpgradeAbilities = {
  volley: 1,
  stun: 0,
  markDuration: 0,
  markBonus: 0,
  shatterMultiplier: 0,
  executeThreshold: 0,
  executeMultiplier: 1,
  bossDamageMultiplier: 1,
  closeDamageMultiplier: 1,
  burnDuration: 2.4,
};

const ABILITY_EFFECTS: Record<UpgradeAbility, Partial<TowerUpgradeAbilities>> = {
  burst: { volley: 2 },
  stun: { stun: 0.22 },
  mark: { markDuration: 3.2, markBonus: 0.12 },
  shatter: { shatterMultiplier: 1.42 },
  execute: { executeThreshold: 0.22, executeMultiplier: 2.6 },
  "boss-hunter": { bossDamageMultiplier: 1.35 },
  "close-range": { closeDamageMultiplier: 1.28 },
  "burn-duration": { burnDuration: 4.2 },
};

export function getTowerUpgradeAbilities(kind: TowerKindKey, a: number, b: number): TowerUpgradeAbilities {
  const pathSet = TOWER_PATHS[kind];
  const out = { ...EMPTY_ABILITIES };
  if (!pathSet) return out;
  const apply = (path: "a" | "b", count: number) => {
    for (let i = 0; i < count; i++) {
      const ability = pathSet[path].tiers[i]?.ability;
      if (!ability) continue;
      const effects = ABILITY_EFFECTS[ability];
      if (effects.volley) out.volley = Math.max(out.volley, effects.volley);
      if (effects.stun) out.stun = Math.max(out.stun, effects.stun);
      if (effects.markDuration) out.markDuration = Math.max(out.markDuration, effects.markDuration);
      if (effects.markBonus) out.markBonus = Math.max(out.markBonus, effects.markBonus);
      if (effects.shatterMultiplier) out.shatterMultiplier = Math.max(out.shatterMultiplier, effects.shatterMultiplier);
      if (effects.executeThreshold) out.executeThreshold = Math.max(out.executeThreshold, effects.executeThreshold);
      if (effects.executeMultiplier) out.executeMultiplier = Math.max(out.executeMultiplier, effects.executeMultiplier);
      if (effects.bossDamageMultiplier) out.bossDamageMultiplier = Math.max(out.bossDamageMultiplier, effects.bossDamageMultiplier);
      if (effects.closeDamageMultiplier) out.closeDamageMultiplier = Math.max(out.closeDamageMultiplier, effects.closeDamageMultiplier);
      if (effects.burnDuration) out.burnDuration = Math.max(out.burnDuration, effects.burnDuration);
    }
  };
  apply("a", Math.min(4, a));
  apply("b", Math.min(4, b));
  return out;
}
