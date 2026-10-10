export type UpgradeAbility =
  | "burst" | "stun" | "mark" | "shatter" | "execute" | "boss-hunter"
  | "close-range" | "burn-duration" | "barrage" | "stun-burst"
  | "burn-pressure" | "swarm" | "brittle" | "kill-rush" | "burn-spread"
  | "chain-escalation" | "elite-hunter" | "precision" | "fast-hunter"
  | "double-tap-mark" | "strong-mark" | "mark-spread" | "commanding-mark"
  | "marking-arc" | "squad-drill" | "squad-command" | "long-stun"
  | "control-network" | "wildfire-network";

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
): UpgradeTier => ({
  name,
  desc,
  cost,
  mods,
  ...(ability !== undefined ? { ability } : {}),
});

/** Shared, bounded Rifleman squad bonuses; used by definitions, simulation, and visuals. */
export const RIFLEMAN_SQUAD_SUPPORT = {
  drill: { radius: 5.2, damageBonus: 0.1, rangeBonus: 0.04 },
  command: { radius: 6.2, damageBonus: 0.15, rangeBonus: 0.08 },
} as const;

export const TOWER_PATHS = {
  rifleman: {
    a: {
      name: "PRECISION FIRE",
      focus: "Turn clean sightlines into reliable eliminations",
      tiers: [
        tier("Scout Optic", "Longer sightline; shots at distant targets (6+ tiles) deal 30% more damage.", 45, { range: 1.14 }, "precision"),
        tier("Hardpoint Rounds", "A heavier cartridge makes every hit count harder.", 95, { dmg: 1.18 }),
        tier("Piercing Round", "Shots jump to one nearby target after impact.", 220, { chain: 1 }, "chain-escalation"),
        tier("Deadeye", "Badly wounded targets are finished by a heavy critical hit.", 500, { crit: 0.3, gore: 1.4, dmg: 1.12 }, "execute"),
      ],
    },
    b: {
      name: "SQUAD DOCTRINE",
      focus: "Mark threats and make nearby Riflemen fight as a team",
      tiers: [
        tier("Twin Guns", "Two barrels fire together; marked targets take 12% more damage from all towers.", 50, {}, "double-tap-mark"),
        tier("Long Calls", "Marked targets stay exposed longer to focused fire.", 105, {}, "strong-mark"),
        tier("Squad Drill", "Nearby Riflemen deal more damage and gain a little range; bonuses do not stack.", 235, {}, "squad-drill"),
        tier("Overwatch Network", "A three-gun volley marks targets; nearby Riflemen gain 15% damage and 8% range.", 520, {}, "squad-command"),
      ],
    },
  },
  shotgunner: {
    a: {
      name: "RIOT",
      focus: "Widen the kill zone and punish crowds",
      tiers: [
        tier("Wide Choke", "Broader impact zone; pellets deal 40% more damage to runners and swarms.", 55, { splash: 0.72 }, "fast-hunter"),
        tier("Buckshot", "Each blast throws a second close-range shell.", 120, { dmg: 1.18 }, "burst"),
        tier("Dragon Breath", "Pellets ignite targets, and burning zombies take extra shotgun damage.", 270, { burn: 10 }, "burn-pressure"),
        tier("Riot Storm", "Blasts that catch two or more zombies hit the whole pack much harder.", 560, { splash: 0.9, gore: 2.1 }, "swarm"),
      ],
    },
    b: {
      name: "BREACH CONTROL",
      focus: "Slow close crowds so the rest of the defense has more time to fire",
      tiers: [
        tier("Concussive Buck", "Close blasts briefly slow hit enemies.", 60, { slow: 0.16 }),
        tier("Suppression Buck", "A stronger slow gives nearby towers more time to fire.", 130, { slow: 0.25 }),
        tier("Exposed Guard", "Blasted targets stay marked and take 20% more damage from all towers.", 290, {}, "strong-mark"),
        tier("Breach Shockwave", "A wider blast slows a pack; marked kills relay target calls to nearby enemies.", 620, { splash: 0.25, slow: 0.32 }, "mark-spread"),
      ],
    },
  },
  sniper: {
    a: {
      name: "OVERWATCH",
      focus: "Spend each shot on the most dangerous target",
      tiers: [
        tier("Longwatch", "Reach farther lanes; shots at distant targets (6+ tiles) deal 30% more damage.", 85, { range: 1.24 }, "precision"),
        tier("Heavy Caliber", "A harder-hitting round makes elites and bosses feel every shot.", 190, { dmg: 1.18 }, "boss-hunter"),
        tier("Wall-Piercer", "A shot can jump to a nearby follow-up target.", 390, { chain: 1 }, "chain-escalation"),
        tier("God's Eye", "Badly wounded targets are candidates for a devastating finishing shot.", 820, { crit: 0.35, range: 1.12, gore: 1.8 }, "execute"),
      ],
    },
    b: {
      name: "SPOTTER NETWORK",
      focus: "Call priority threats and share their weaknesses with the defense",
      tiers: [
        tier("Spotter Scope", "The first hit marks a priority target; all towers deal 12% more damage to it for 3.2 seconds.", 90, {}, "mark"),
        tier("Radio Relay", "Target calls last longer and expose a target more clearly to every allied tower.", 205, {}, "strong-mark"),
        tier("Priority Broadcast", "When a marked target falls, nearby enemies inherit the target call.", 420, {}, "mark-spread"),
        tier("Kill Order", "Elite target calls last longer and chain across a wider group when a marked enemy falls.", 900, { range: 1.06 }, "commanding-mark"),
      ],
    },
  },
  tesla: {
    a: {
      name: "CHAIN COIL",
      focus: "Turn packed waves into an escalating electrical cascade",
      tiers: [
        tier("Extra Arc", "Arc one additional target; each jump hits 25% harder than the last.", 95, { chain: 1 }, "chain-escalation"),
        tier("Conductors", "Arcs reach a wider pocket.", 195, { range: 1.2, chain: 1 }),
        tier("Storm Net", "Reach two more enemies with each discharge.", 390, { chain: 2 }, "chain-escalation"),
        tier("Tempest", "Expand the chain and make each jump hit harder.", 820, { chain: 2, range: 1.25, dmg: 1.08 }, "chain-escalation"),
      ],
    },
    b: {
      name: "GRID CONTROL",
      focus: "Lock down clustered enemies and expose them to allied fire",
      tiers: [
        tier("Static Lock", "Electrical hits briefly stun targets, including enemies reached by a chain.", 90, {}, "stun"),
        tier("Conductive Tags", "Arcs mark each target they hit; all towers deal 20% more damage to marked enemies.", 195, {}, "strong-mark"),
        tier("Arc Lockdown", "The grid's pulse holds a target in place longer and slows its advance.", 400, { slow: 0.24 }, "long-stun"),
        tier("Network Collapse", "Longer stuns and marks spread from a defeated marked target to nearby enemies.", 840, { chain: 1 }, "control-network"),
      ],
    },
  },
  flamethrower: {
    a: {
      name: "INFERNO",
      focus: "Build sustained burn damage that overwhelms a lane",
      tiers: [
        tier("Hot Fuel", "Burns persist longer after the first hit.", 65, { burn: 5 }, "burn-duration"),
        tier("Sticky Napalm", "Burning targets stay aflame longer and take 35% more flame damage.", 145, { burn: 7, splash: 0.45 }, "burn-pressure"),
        tier("Firestorm", "A wider cone punishes tightly packed groups.", 310, { range: 1.2, splash: 0.55 }, "swarm"),
        tier("Wildfire", "Burning kills spread fire to nearby zombies.", 650, { burn: 14, splash: 0.65, gore: 1.6 }, "burn-spread"),
      ],
    },
    b: {
      name: "FIREBREAK",
      focus: "Cover a lane with heat that slows and spreads through crowds",
      tiers: [
        tier("Wide Cone", "A broader stream slows the crowd and covers more of a bend.", 70, { splash: 0.65, range: 1.1, slow: 0.14 }),
        tier("Scald", "Burning kills spread their flames to nearby zombies.", 150, { burn: 5 }, "burn-spread"),
        tier("Heat Haze", "A broader stream slows enemies for longer exposure to flames.", 320, { slow: 0.22, range: 1.08 }),
        tier("Wildfire Relay", "Burning kills spread fire across a wider pocket.", 680, { splash: 0.45 }, "wildfire-network"),
      ],
    },
  },
  freezer: {
    a: {
      name: "SHATTER",
      focus: "Turn slowed enemies into brittle, high-value damage windows",
      tiers: [
        tier("Ice Shards", "Hits deal 42% more damage to slowed targets.", 65, {}, "shatter"),
        tier("Frostbite", "Brittle targets can take devastating critical hits.", 145, { crit: 0.18 }, "shatter"),
        tier("Brittle Bones", "Slowed targets take 75% extra shatter damage.", 300, { dmg: 1.22 }, "brittle"),
        tier("Shatterstorm", "Brittle targets take heavy bonus damage, and the wider impact catches nearby enemies.", 620, { dmg: 1.28, gore: 2.3, splash: 0.7 }, "brittle"),
      ],
    },
    b: {
      name: "COLD FRONT",
      focus: "Slow packs and make them easier for the whole defense to finish",
      tiers: [
        tier("Chill Mist", "A wider chill pocket slows clustered zombies so other towers get more firing time.", 60, { slow: 0.42, splash: 0.7 }, "mark"),
        tier("Wide Nozzle", "Reach farther into the lane and keep exposed enemies marked for allied attacks.", 135, { range: 1.2, splash: 0.7 }, "strong-mark"),
        tier("Cryo Core", "A stronger chill pulse slows enemies instead of freezing them in place.", 280, { slow: 0.58, rate: 1.08 }),
        tier("Absolute Zero", "A wide chill pulse slows and marks the crowd; marked kills relay the signal.", 590, { slow: 0.7, splash: 1.2, range: 1.18 }, "mark-spread"),
      ],
    },
  },
  rocket: {
    a: {
      name: "SIEGE ARTILLERY",
      focus: "Make every shell a high-impact answer to dense waves and tough targets",
      tiers: [
        tier("Long Gun", "Reach the next bend; shells at distant targets (6+ tiles) deal 30% more damage.", 75, { range: 1.2 }, "precision"),
        tier("Demolition Charge", "A denser warhead hits harder on direct impact.", 160, { dmg: 1.2 }),
        tier("Cluster Shot", "A wider blast hits packs of two or more far harder.", 320, { splash: 1.15 }, "swarm"),
        tier("Bombardier", "Large shells dominate long sightlines and bends.", 690, { range: 1.25, splash: 1.2, dmg: 1.18 }, "elite-hunter"),
      ],
    },
    b: {
      name: "TACTICAL BARRAGE",
      focus: "Use broad blast slows and shared target calls to manage crowded lanes",
      tiers: [
        tier("Tar Shells", "Explosions slow targets so other towers have more time to fire.", 80, { slow: 0.32, splash: 0.4 }),
        tier("Concussion Warhead", "A heavy shockwave slows direct and splash targets.", 170, { slow: 0.4, splash: 0.2 }),
        tier("Signal Flare", "Marked enemies take 20% more damage from every tower for longer.", 350, {}, "strong-mark"),
        tier("Suppressing Salvo", "Large slow fields spread target calls when marked enemies fall.", 740, { splash: 0.35, slow: 0.5 }, "mark-spread"),
      ],
    },
  },
  laser: {
    a: {
      name: "FOCUS ARRAY",
      focus: "Concentrate power into one doomed target",
      tiers: [
        tier("Tight Beam", "Focused contact bites harder.", 160, { dmg: 1.18 }),
        tier("Prism Lens", "Refine the beam for a stronger hit on every contact.", 340, { dmg: 1.12 }),
        tier("Fusion Core", "The beam is tuned for elite targets.", 680, { range: 1.18, dmg: 1.2 }, "boss-hunter"),
        tier("Deathray", "Low-health targets are vaporized by a devastating finishing hit.", 1320, { dmg: 1.45, crit: 0.28, gore: 3 }, "execute"),
      ],
    },
    b: {
      name: "PRISM RELAY",
      focus: "Spread target intelligence and status pressure through chained beams",
      tiers: [
        tier("Beam Splitter", "The beam tags targets as it jumps, helping every tower focus the same threat.", 155, { chain: 1 }, "marking-arc"),
        tier("Refraction", "The beam can reach more targets, and its marks stay active longer.", 330, { chain: 2, range: 1.12 }, "strong-mark"),
        tier("Thermal Bloom", "Refractions ignite the crowd; burning targets take extra beam damage.", 650, { burn: 14, splash: 0.5 }, "burn-pressure"),
        tier("Starfall Relay", "Chained hits mark the crowd; when a marked enemy falls, its neighbors inherit the signal.", 1280, { chain: 2, dmg: 1.08, rate: 1.04 }, "mark-spread"),
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
  markSpreadRadius: number;
  squadRadius: number;
  squadDamageBonus: number;
  squadRangeBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
  stunnedMultiplier: number;
  burningMultiplier: number;
  swarmMultiplier: number;
  killRush: number;
  burnSpread: number;
  chainEscalation: number;
  eliteDamageMultiplier: number;
  precisionMultiplier: number;
  fastDamageMultiplier: number;
};

const EMPTY_ABILITIES: TowerUpgradeAbilities = {
  volley: 1,
  stun: 0,
  markDuration: 0,
  markBonus: 0,
  markSpreadRadius: 0,
  squadRadius: 0,
  squadDamageBonus: 0,
  squadRangeBonus: 0,
  shatterMultiplier: 0,
  executeThreshold: 0,
  executeMultiplier: 1,
  bossDamageMultiplier: 1,
  closeDamageMultiplier: 1,
  burnDuration: 2.4,
  stunnedMultiplier: 1,
  burningMultiplier: 1,
  swarmMultiplier: 1,
  killRush: 1,
  burnSpread: 0,
  chainEscalation: 0,
  eliteDamageMultiplier: 1,
  precisionMultiplier: 1,
  fastDamageMultiplier: 1,
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
  barrage: { volley: 3 },
  "stun-burst": { stun: 0.22, stunnedMultiplier: 1.5 },
  "burn-pressure": { burningMultiplier: 1.35 },
  swarm: { swarmMultiplier: 1.6 },
  brittle: { shatterMultiplier: 1.75 },
  "kill-rush": { killRush: 1.35 },
  "burn-spread": { burnSpread: 2.6 },
  "chain-escalation": { chainEscalation: 0.25 },
  "elite-hunter": { eliteDamageMultiplier: 1.3 },
  precision: { precisionMultiplier: 1.3 },
  "fast-hunter": { fastDamageMultiplier: 1.4 },
  "double-tap-mark": { volley: 2, markDuration: 3.2, markBonus: 0.12 },
  "strong-mark": { markDuration: 4.5, markBonus: 0.2 },
  "mark-spread": { markDuration: 4.5, markBonus: 0.2, markSpreadRadius: 2.3 },
  "commanding-mark": { markDuration: 5.5, markBonus: 0.22, markSpreadRadius: 2.8 },
  "marking-arc": { markDuration: 4, markBonus: 0.16, chainEscalation: 0.25 },
  "squad-drill": {
    squadRadius: RIFLEMAN_SQUAD_SUPPORT.drill.radius,
    squadDamageBonus: RIFLEMAN_SQUAD_SUPPORT.drill.damageBonus,
    squadRangeBonus: RIFLEMAN_SQUAD_SUPPORT.drill.rangeBonus,
  },
  "squad-command": {
    volley: 3,
    markDuration: 4.8,
    markBonus: 0.2,
    markSpreadRadius: 2.4,
    squadRadius: RIFLEMAN_SQUAD_SUPPORT.command.radius,
    squadDamageBonus: RIFLEMAN_SQUAD_SUPPORT.command.damageBonus,
    squadRangeBonus: RIFLEMAN_SQUAD_SUPPORT.command.rangeBonus,
  },
  "long-stun": { stun: 0.42 },
  "control-network": {
    stun: 0.42,
    markDuration: 4.5,
    markBonus: 0.2,
    markSpreadRadius: 2.4,
  },
  "wildfire-network": { burnSpread: 3.4 },
};

export function getTowerUpgradeAbilities(
  kind: TowerKindKey,
  a: number,
  b: number,
): TowerUpgradeAbilities {
  const pathSet = TOWER_PATHS[kind];
  const out = { ...EMPTY_ABILITIES };
  if (!pathSet) return out;

  const apply = (path: "a" | "b", count: number) => {
    for (let i = 0; i < Math.min(4, count); i++) {
      const ability = pathSet[path].tiers[i]?.ability;
      if (!ability) continue;
      const effects = ABILITY_EFFECTS[ability];
      if (effects.volley) out.volley = Math.max(out.volley, effects.volley);
      if (effects.stun) out.stun = Math.max(out.stun, effects.stun);
      if (effects.markDuration) out.markDuration = Math.max(out.markDuration, effects.markDuration);
      if (effects.markBonus) out.markBonus = Math.max(out.markBonus, effects.markBonus);
      if (effects.markSpreadRadius) out.markSpreadRadius = Math.max(out.markSpreadRadius, effects.markSpreadRadius);
      if (effects.squadRadius) out.squadRadius = Math.max(out.squadRadius, effects.squadRadius);
      if (effects.squadDamageBonus) out.squadDamageBonus = Math.max(out.squadDamageBonus, effects.squadDamageBonus);
      if (effects.squadRangeBonus) out.squadRangeBonus = Math.max(out.squadRangeBonus, effects.squadRangeBonus);
      if (effects.shatterMultiplier) out.shatterMultiplier = Math.max(out.shatterMultiplier, effects.shatterMultiplier);
      if (effects.executeThreshold) out.executeThreshold = Math.max(out.executeThreshold, effects.executeThreshold);
      if (effects.executeMultiplier) out.executeMultiplier = Math.max(out.executeMultiplier, effects.executeMultiplier);
      if (effects.bossDamageMultiplier) out.bossDamageMultiplier = Math.max(out.bossDamageMultiplier, effects.bossDamageMultiplier);
      if (effects.closeDamageMultiplier) out.closeDamageMultiplier = Math.max(out.closeDamageMultiplier, effects.closeDamageMultiplier);
      if (effects.burnDuration) out.burnDuration = Math.max(out.burnDuration, effects.burnDuration);
      if (effects.stunnedMultiplier) out.stunnedMultiplier = Math.max(out.stunnedMultiplier, effects.stunnedMultiplier);
      if (effects.burningMultiplier) out.burningMultiplier = Math.max(out.burningMultiplier, effects.burningMultiplier);
      if (effects.swarmMultiplier) out.swarmMultiplier = Math.max(out.swarmMultiplier, effects.swarmMultiplier);
      if (effects.killRush) out.killRush = Math.max(out.killRush, effects.killRush);
      if (effects.burnSpread) out.burnSpread = Math.max(out.burnSpread, effects.burnSpread);
      if (effects.chainEscalation) out.chainEscalation = Math.max(out.chainEscalation, effects.chainEscalation);
      if (effects.eliteDamageMultiplier) out.eliteDamageMultiplier = Math.max(out.eliteDamageMultiplier, effects.eliteDamageMultiplier);
      if (effects.precisionMultiplier) out.precisionMultiplier = Math.max(out.precisionMultiplier, effects.precisionMultiplier);
      if (effects.fastDamageMultiplier) out.fastDamageMultiplier = Math.max(out.fastDamageMultiplier, effects.fastDamageMultiplier);
    }
  };

  apply("a", Math.min(4, a));
  apply("b", Math.min(4, b));
  return out;
}
