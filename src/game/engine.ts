// Pure game simulation for the idle tower defense game.
// No React, no three.js — just numbers the renderer reads each frame.

import { sfx } from "./audio";
import { evaluateStageObjectives, type StageDefinition } from "./navigation";
import { chooseEnemyKind, getEnemySpawnStats } from "./enemySpawns";
import { resolveDamage } from "./damage";
import { getTowerCombatStats } from "./towerStats";
import { isStageWinReady, resolveBaseHit } from "./stageOutcomes";
import { getChainTargets, getSplashTargets } from "./projectileImpact";
import { applyProjectileStatusEffects } from "./projectileEffects";
import {
  advanceTowerCooldown,
  createTowerProjectile,
  PROJECTILE_CHAIN_DAMAGE_MULTIPLIER,
  PROJECTILE_SPLASH_DAMAGE_MULTIPLIER,
  stepProjectile,
} from "./towerCombat";
import { stepEnemyRagdoll, stepLivingEnemy, shouldDespawnEnemy } from "./enemyLifecycle";
import {
  canBuyTier as canBuyTowerTier,
  tierCost as getTowerTierCost,
  towerSellValue as calculateTowerSellValue,
  towerUpgradeCost as calculateTowerUpgradeCost,
} from "./towerActions";
import { selectTowerTarget } from "./targeting";
import { profile } from "./profile";
import type { RandomSource } from "./random";
import { getWaveSpawnPlan } from "./waves";
import { getCombatFeedback } from "./combatFeel";
import { createRunModifierOffer, getRunModifierEffects, shouldOfferRunModifier, type RunModifierDefinition, type RunModifierId } from "./runModifiers";
import { track } from "./analytics";

export type Vec2 = { x: number; z: number };

export const PATH: Vec2[] = [
  { x: -6, z: -22 },
  { x: -6, z: -9 },
  { x: 5, z: -9 },
  { x: 5, z: 2 },
  { x: -4, z: 2 },
  { x: -4, z: 11 },
];

export const PATH_LENGTH = (() => {
  let len = 0;
  for (let i = 1; i < PATH.length; i++) {
    len += Math.hypot(PATH[i]!.x - PATH[i - 1]!.x, PATH[i]!.z - PATH[i - 1]!.z);
  }
  return len;
})();

export function pointAt(dist: number): Vec2 {
  let d = Math.max(0, dist);
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1]!;
    const b = PATH[i]!;
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    d -= seg;
  }
  return PATH[PATH.length - 1]!;
}

/** Fixed pads the player can build on. */
export const BUILD_SPOTS: Vec2[] = [
  { x: -9.6, z: -18 },
  { x: -1.6, z: -14 },
  { x: -9.2, z: -9 },
  { x: 8.4, z: -12 },
  { x: 0.2, z: -5.4 },
  { x: 8.6, z: -3.6 },
  { x: -8.6, z: -1.5 },
  { x: 8.6, z: 5.4 },
  { x: 1.6, z: 6.2 },
  { x: -9.4, z: 7.4 },
];

export type Zombie = {
  id: number;
  dist: number;
  hp: number;
  maxHp: number;
  speed: number;
  kind: 0 | 1 | 2; // walker, runner, brute
  x: number;
  y: number;
  z: number;
  wobble: number;
  dead: boolean;
  fade: number;
  flash: number;
  slow: number;
  burn: number;
  burnTime: number;
  // ragdoll
  vx: number;
  vy: number;
  vz: number;
  tilt: number;
  spin: number;
  roll: number;
  gibbed: boolean;
};

export type Gib = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  spin: number;
  life: number;
  size: number;
  tint: number;
};
export type DamagePopup = {
  id: number;
  x: number;
  y: number;
  z: number;
  value: number;
  life: number;
  crit: boolean;
  gold: number;
};
export type TowerKind =
  | "rifleman"
  | "shotgunner"
  | "sniper"
  | "tesla"
  | "flamethrower"
  | "freezer"
  | "rocket"
  | "laser";
export type TargetMode = "first" | "last" | "strongest";

export type Tower = {
  id: number;
  kind: TowerKind;
  spot: number;
  x: number;
  z: number;
  level: number; // 1..MAX_TOWER_LEVEL, bought with gold
  a: number; // tiers bought in path A (0-4)
  b: number; // tiers bought in path B (0-4)
  targetMode: TargetMode;
  cooldown: number;
  aim: number;
  recoil: number;
};

export const TOWER_KINDS: TowerKind[] = [
  "rifleman",
  "shotgunner",
  "sniper",
  "tesla",
  "flamethrower",
  "freezer",
  "rocket",
  "laser",
];

export type Bullet = {
  id: number;
  x: number;
  z: number;
  y: number;
  tx: number;
  tz: number;
  speed: number;
  damage: number;
  target: number;
  kind: TowerKind;
  splash: number;
  chain: number;
  slow: number;
  burn: number;
  gold: number;
  crit: boolean;
  alive: boolean;
};

export type TowerDef = {
  name: string;
  blurb: string;
  damage: number;
  rate: number;
  range: number;
  cost: number;
  accent: string;
  /** Base gold cost of the first level-up; scales per level. */
  upgradeBase: number;
  /** Player level needed before this tower can be built. */
  unlockLevel: number;
  /** Coins that unlock the tower early (0 = free from the start). */
  coinUnlock: number;
  /** Innate behaviour. */
  splash?: number;
  chain?: number;
  slow?: number;
  burn?: number;
  shape?: "double" | "long" | "wide" | "nozzle" | "orb" | "pods" | "lens";
};

export const TOWER_INFO: Record<TowerKind, TowerDef> = {
  rifleman: {
    name: "Rifleman",
    blurb: "Cheap, fast shots at long range",
    damage: 6,
    rate: 2.2,
    range: 7.6,
    cost: 40,
    accent: "#e9b44c",
    upgradeBase: 30,
    unlockLevel: 1,
    coinUnlock: 0,
  },
  shotgunner: {
    name: "Shotgunner",
    blurb: "Short range, heavy spread damage",
    damage: 15,
    rate: 1.1,
    range: 4.3,
    cost: 65,
    accent: "#d98a3c",
    upgradeBase: 45,
    unlockLevel: 1,
    coinUnlock: 0,
    splash: 1.9,
    shape: "double",
  },
  freezer: {
    name: "Freezer",
    blurb: "Low damage, heavy slow",
    damage: 4,
    rate: 1.4,
    range: 6,
    cost: 60,
    accent: "#79c7e3",
    upgradeBase: 40,
    unlockLevel: 1,
    coinUnlock: 0,
    slow: 0.35,
    shape: "nozzle",
  },
  sniper: {
    name: "Sniper",
    blurb: "Very long range, huge single hits",
    damage: 62,
    rate: 0.36,
    range: 14,
    cost: 120,
    accent: "#8fb98a",
    upgradeBase: 80,
    unlockLevel: 2,
    coinUnlock: 350,
    shape: "long",
  },
  tesla: {
    name: "Tesla",
    blurb: "Chain lightning across the horde",
    damage: 12,
    rate: 1.1,
    range: 5.6,
    cost: 90,
    accent: "#b892ff",
    upgradeBase: 60,
    unlockLevel: 3,
    coinUnlock: 550,
    chain: 2,
    shape: "orb",
  },
  flamethrower: {
    name: "Flamethrower",
    blurb: "Burns groups over time",
    damage: 4,
    rate: 3.4,
    range: 5,
    cost: 95,
    accent: "#f2703b",
    upgradeBase: 65,
    unlockLevel: 4,
    coinUnlock: 800,
    burn: 7,
    splash: 1.3,
    shape: "wide",
  },
  rocket: {
    name: "Rocket",
    blurb: "Slow shots, big explosions",
    damage: 42,
    rate: 0.5,
    range: 8.6,
    cost: 130,
    accent: "#e2725b",
    upgradeBase: 90,
    unlockLevel: 5,
    coinUnlock: 1100,
    splash: 3,
    shape: "pods",
  },
  laser: {
    name: "Laser",
    blurb: "Expensive, melts single targets",
    damage: 34,
    rate: 2.6,
    range: 9.2,
    cost: 220,
    accent: "#63e6c3",
    upgradeBase: 150,
    unlockLevel: 7,
    coinUnlock: 1600,
    shape: "lens",
  },
};

export const MAX_TOWER_LEVEL = 8;

/** Projectile flight speed per tower. */
export const BULLET_SPEED: Record<TowerKind, number> = {
  rifleman: 22,
  shotgunner: 18,
  sniper: 60,
  tesla: 30,
  flamethrower: 12,
  freezer: 20,
  rocket: 14,
  laser: 80,
};

/** Which existing shot sound each tower reuses. */
export const SHOOT_SFX: Record<
  TowerKind,
  "shootGunner" | "shootCannon" | "shootFrost" | "shootTesla"
> = {
  rifleman: "shootGunner",
  shotgunner: "shootCannon",
  sniper: "shootCannon",
  tesla: "shootTesla",
  flamethrower: "shootFrost",
  freezer: "shootFrost",
  rocket: "shootCannon",
  laser: "shootTesla",
};

/** How violently kills from each tower come apart. */
export const GORE_BASE: Record<TowerKind, number> = {
  rifleman: 1,
  shotgunner: 1.5,
  sniper: 1.6,
  tesla: 1.1,
  flamethrower: 1.2,
  freezer: 1,
  rocket: 1.9,
  laser: 1.3,
};

/** Gold cost of the next level-up for this tower. */
export function towerUpgradeCost(t: Tower) {
  return calculateTowerUpgradeCost(t, TOWER_INFO[t.kind], MAX_TOWER_LEVEL);
}

/* ---------------- upgrade paths ---------------- */

export type Mods = {
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

export type Tier = { name: string; desc: string; cost: number; mods: Mods };
export type UpgradePath = { name: string; focus: string; tiers: [Tier, Tier, Tier, Tier] };

export const TOWER_PATHS: Record<TowerKind, { a: UpgradePath; b: UpgradePath }> = {
  rifleman: {
    a: {
      name: "Marksman",
      focus: "Range & precision",
      tiers: [
        {
          name: "Long Barrel",
          desc: "+25% range, +15% damage",
          cost: 50,
          mods: { range: 1.25, dmg: 1.15 },
        },
        {
          name: "Scope",
          desc: "+20% range, 20% crit chance",
          cost: 110,
          mods: { range: 1.2, crit: 0.2 },
        },
        {
          name: "Hollow Points",
          desc: "+60% damage, 30% crit",
          cost: 240,
          mods: { dmg: 1.6, crit: 0.3 },
        },
        {
          name: "Deadeye",
          desc: "+120% damage, wide reach",
          cost: 520,
          mods: { dmg: 2.2, range: 1.25, crit: 0.4, gore: 1.5 },
        },
      ],
    },
    b: {
      name: "Suppressor",
      focus: "Rate of fire",
      tiers: [
        { name: "Quick Hands", desc: "+40% fire rate", cost: 45, mods: { rate: 1.4 } },
        { name: "Drum Mag", desc: "+45% fire rate", cost: 100, mods: { rate: 1.45 } },
        {
          name: "Twin Barrels",
          desc: "+60% rate, +25% damage",
          cost: 230,
          mods: { rate: 1.6, dmg: 1.25 },
        },
        {
          name: "Minigun",
          desc: "+120% rate, more gold per kill",
          cost: 500,
          mods: { rate: 2.2, dmg: 1.2, gold: 1.25 },
        },
      ],
    },
  },
  rocket: {
    a: {
      name: "Siege Artillery",
      focus: "Range & slowing shrapnel",
      tiers: [
        { name: "Long Gun", desc: "+30% range", cost: 80, mods: { range: 1.3 } },
        {
          name: "Tar Shells",
          desc: "Shots slow zombies 35%",
          cost: 170,
          mods: { slow: 0.35, splash: 0.6 },
        },
        {
          name: "Cluster Shot",
          desc: "+1.4 blast radius, +25% damage",
          cost: 340,
          mods: { splash: 1.4, dmg: 1.25 },
        },
        {
          name: "Bombardier",
          desc: "+45% range, 55% slow, huge blast",
          cost: 720,
          mods: { range: 1.45, slow: 0.55, splash: 1.8, dmg: 1.3 },
        },
      ],
    },
    b: {
      name: "Point Blank",
      focus: "Pure close-range killing",
      tiers: [
        {
          name: "Packed Powder",
          desc: "+70% damage, -10% range",
          cost: 85,
          mods: { dmg: 1.7, range: 0.9 },
        },
        { name: "Rapid Loader", desc: "+55% fire rate", cost: 180, mods: { rate: 1.55 } },
        { name: "Siege Slugs", desc: "+110% damage", cost: 360, mods: { dmg: 2.1 } },
        {
          name: "Meat Grinder",
          desc: "+180% damage, gibs everything",
          cost: 760,
          mods: { dmg: 2.8, rate: 1.3, gore: 2.5 },
        },
      ],
    },
  },
  freezer: {
    a: {
      name: "Deep Freeze",
      focus: "Crowd control",
      tiers: [
        {
          name: "Chill Mist",
          desc: "Slow 45%, small blast",
          cost: 65,
          mods: { slow: 0.45, splash: 1 },
        },
        {
          name: "Wide Nozzle",
          desc: "+30% range, bigger blast",
          cost: 140,
          mods: { range: 1.3, splash: 1 },
        },
        {
          name: "Cryo Core",
          desc: "Slow 62%, +50% rate",
          cost: 290,
          mods: { slow: 0.62, rate: 1.5 },
        },
        {
          name: "Absolute Zero",
          desc: "Slow 75% in a huge radius",
          cost: 600,
          mods: { slow: 0.75, splash: 1.6, range: 1.25 },
        },
      ],
    },
    b: {
      name: "Shatter",
      focus: "Damage on frozen flesh",
      tiers: [
        { name: "Ice Shards", desc: "+90% damage", cost: 70, mods: { dmg: 1.9 } },
        {
          name: "Frostbite",
          desc: "+70% damage, 20% crit",
          cost: 150,
          mods: { dmg: 1.7, crit: 0.2 },
        },
        {
          name: "Brittle Bones",
          desc: "+90% damage, 35% crit",
          cost: 310,
          mods: { dmg: 1.9, crit: 0.35 },
        },
        {
          name: "Shatterstorm",
          desc: "+150% damage, bodies explode",
          cost: 640,
          mods: { dmg: 2.5, rate: 1.3, gore: 2.2 },
        },
      ],
    },
  },
  tesla: {
    a: {
      name: "Chain Coil",
      focus: "Hitting the whole horde",
      tiers: [
        { name: "Extra Arc", desc: "+1 chain target", cost: 100, mods: { chain: 1, splash: 0.4 } },
        {
          name: "Conductors",
          desc: "+30% range, +1 chain",
          cost: 210,
          mods: { range: 1.3, chain: 1 },
        },
        {
          name: "Storm Net",
          desc: "+2 chains, +25% damage",
          cost: 420,
          mods: { chain: 2, dmg: 1.25, splash: 0.6 },
        },
        {
          name: "Tempest",
          desc: "+3 chains, +40% range",
          cost: 880,
          mods: { chain: 3, range: 1.4, dmg: 1.3 },
        },
      ],
    },
    b: {
      name: "Overload",
      focus: "Raw single-target power",
      tiers: [
        { name: "Capacitors", desc: "+80% damage", cost: 95, mods: { dmg: 1.8 } },
        { name: "Fast Discharge", desc: "+60% fire rate", cost: 200, mods: { rate: 1.6 } },
        {
          name: "Arc Furnace",
          desc: "+110% damage, 25% crit",
          cost: 400,
          mods: { dmg: 2.1, crit: 0.25 },
        },
        {
          name: "Annihilator",
          desc: "+200% damage, vaporizes bodies",
          cost: 840,
          mods: { dmg: 3, rate: 1.25, gore: 3 },
        },
      ],
    },
  },
  shotgunner: {
    a: {
      name: "Riot Spread",
      focus: "Crowd shredding",
      tiers: [
        { name: "Wide Choke", desc: "+0.8 blast radius", cost: 60, mods: { splash: 0.8 } },
        {
          name: "Buckshot",
          desc: "+45% damage, bigger spread",
          cost: 130,
          mods: { dmg: 1.45, splash: 0.6 },
        },
        {
          name: "Dragon's Breath",
          desc: "Shots set zombies alight",
          cost: 280,
          mods: { burn: 6, splash: 0.6 },
        },
        {
          name: "Riot Storm",
          desc: "+90% damage, huge spread",
          cost: 590,
          mods: { dmg: 1.9, splash: 1.4, gore: 2 },
        },
      ],
    },
    b: {
      name: "Executioner",
      focus: "Point-blank stopping power",
      tiers: [
        {
          name: "Slug Rounds",
          desc: "+75% damage, -15% spread",
          cost: 65,
          mods: { dmg: 1.75, splash: -0.4 },
        },
        { name: "Pump Grip", desc: "+50% fire rate", cost: 140, mods: { rate: 1.5 } },
        {
          name: "Breacher",
          desc: "+90% damage, 25% crit",
          cost: 300,
          mods: { dmg: 1.9, crit: 0.25 },
        },
        {
          name: "Gore Cannon",
          desc: "+170% damage, gibs everything",
          cost: 620,
          mods: { dmg: 2.7, rate: 1.25, gore: 2.6 },
        },
      ],
    },
  },
  sniper: {
    a: {
      name: "Overwatch",
      focus: "Reach across the map",
      tiers: [
        { name: "Bipod", desc: "+25% range", cost: 90, mods: { range: 1.25 } },
        {
          name: "Rangefinder",
          desc: "+20% range, 25% crit",
          cost: 200,
          mods: { range: 1.2, crit: 0.25 },
        },
        {
          name: "Match Barrel",
          desc: "+70% damage, +15% range",
          cost: 400,
          mods: { dmg: 1.7, range: 1.15 },
        },
        {
          name: "God's Eye",
          desc: "+150% damage, 45% crit",
          cost: 850,
          mods: { dmg: 2.5, crit: 0.45, range: 1.2, gore: 1.8 },
        },
      ],
    },
    b: {
      name: "Anti-Materiel",
      focus: "Killing big targets fast",
      tiers: [
        { name: "Quick Bolt", desc: "+45% fire rate", cost: 95, mods: { rate: 1.45 } },
        { name: "Heavy Rounds", desc: "+80% damage", cost: 210, mods: { dmg: 1.8 } },
        {
          name: "Explosive Tips",
          desc: "+1.6 blast radius",
          cost: 430,
          mods: { splash: 1.6, dmg: 1.2 },
        },
        {
          name: "Brute Breaker",
          desc: "+200% damage, wrecks brutes",
          cost: 900,
          mods: { dmg: 3, rate: 1.2, gore: 2.4 },
        },
      ],
    },
  },
  flamethrower: {
    a: {
      name: "Inferno",
      focus: "Burning damage over time",
      tiers: [
        { name: "Hot Fuel", desc: "+6 burn damage per second", cost: 70, mods: { burn: 6 } },
        {
          name: "Sticky Napalm",
          desc: "+9 burn, bigger cone",
          cost: 150,
          mods: { burn: 9, splash: 0.5 },
        },
        {
          name: "Firestorm",
          desc: "+14 burn, +30% range",
          cost: 320,
          mods: { burn: 14, range: 1.3 },
        },
        {
          name: "Hellmouth",
          desc: "+26 burn, everything cooks",
          cost: 660,
          mods: { burn: 26, splash: 0.8, gore: 2.2 },
        },
      ],
    },
    b: {
      name: "Pressure Tank",
      focus: "Raw output on groups",
      tiers: [
        {
          name: "Wide Cone",
          desc: "+0.7 spread, +20% range",
          cost: 75,
          mods: { splash: 0.7, range: 1.2 },
        },
        { name: "High Pressure", desc: "+45% fire rate", cost: 160, mods: { rate: 1.45 } },
        { name: "Twin Nozzles", desc: "+90% damage", cost: 330, mods: { dmg: 1.9 } },
        {
          name: "Purifier",
          desc: "+160% damage, huge cone",
          cost: 680,
          mods: { dmg: 2.6, splash: 1.2, rate: 1.2 },
        },
      ],
    },
  },
  laser: {
    a: {
      name: "Focus Array",
      focus: "Single-target annihilation",
      tiers: [
        { name: "Tight Beam", desc: "+70% damage", cost: 170, mods: { dmg: 1.7 } },
        {
          name: "Prism Lens",
          desc: "+55% damage, 25% crit",
          cost: 360,
          mods: { dmg: 1.55, crit: 0.25 },
        },
        {
          name: "Fusion Core",
          desc: "+90% damage, +20% range",
          cost: 700,
          mods: { dmg: 1.9, range: 1.2 },
        },
        {
          name: "Deathray",
          desc: "+220% damage, vaporizes bodies",
          cost: 1400,
          mods: { dmg: 3.2, crit: 0.4, gore: 3 },
        },
      ],
    },
    b: {
      name: "Scatter Optics",
      focus: "Cutting through crowds",
      tiers: [
        { name: "Beam Splitter", desc: "+1 chain target", cost: 165, mods: { chain: 1 } },
        {
          name: "Refraction",
          desc: "+2 chains, +25% range",
          cost: 350,
          mods: { chain: 2, range: 1.25 },
        },
        {
          name: "Thermal Bloom",
          desc: "Beams ignite for 18/s",
          cost: 680,
          mods: { burn: 18, splash: 0.6 },
        },
        {
          name: "Starfall",
          desc: "+3 chains, +80% damage",
          cost: 1350,
          mods: { chain: 3, dmg: 1.8, rate: 1.2 },
        },
      ],
    },
  },
};

/** Classic rule: only one path may go past tier 2. */
export function canBuyTier(t: Tower, path: "a" | "b") {
  return canBuyTowerTier(t, path);
}

export function tierCost(t: Tower, path: "a" | "b") {
  return getTowerTierCost(t, path, TOWER_PATHS[t.kind]);
}

function towerCombatStats(t: Tower) {
  return getTowerCombatStats(
    t,
    TOWER_INFO[t.kind],
    TOWER_PATHS[t.kind],
    towerProfileBonus(t.kind),
  );
}

/** Total tiers bought across both paths (used for visuals). */
export function towerTiers(t: Tower) {
  return t.a + t.b;
}
export function towerLevel(t: Tower) {
  return t.level;
}
export function towerDamage(t: Tower) {
  return towerCombatStats(t).damage;
}
export function towerRange(t: Tower) {
  return towerCombatStats(t).range;
}
export function towerRate(t: Tower) {
  return towerCombatStats(t).rate;
}
export function towerSlow(t: Tower) {
  return towerCombatStats(t).slow;
}
export function towerSplash(t: Tower) {
  return towerCombatStats(t).splash;
}
export function towerChain(t: Tower) {
  return towerCombatStats(t).chain;
}
export function towerBurn(t: Tower) {
  return towerCombatStats(t).burn;
}
export function towerCrit(t: Tower) {
  return towerCombatStats(t).crit;
}
export function towerGore(t: Tower) {
  return towerCombatStats(t).gore;
}
export function towerGold(t: Tower) {
  return towerCombatStats(t).gold;
}
export function towerSellValue(t: Tower) {
  return calculateTowerSellValue(
    t,
    TOWER_INFO[t.kind],
    TOWER_PATHS[t.kind],
    MAX_TOWER_LEVEL,
  );
}

export const MAX_PROFILE_TOWER_UPGRADE = 5;

export function towerProfileUpgradeLevel(kind: TowerKind) {
  return profile.towerUpgradeLevel(kind);
}

export function towerProfileUpgradeCost(kind: TowerKind) {
  return profile.towerUpgradeCost(TOWER_INFO[kind].upgradeBase, kind);
}

export function towerProfileBonus(kind: TowerKind) {
  const level = towerProfileUpgradeLevel(kind);
  return {
    level,
    damage: Math.pow(1.08, level),
    rate: Math.pow(1.03, level),
    range: 1 + level * 0.02,
  };
}

/** Whether the player's progression allows building this tower. */
export function towerUnlocked(kind: TowerKind, playerLevel: number, purchased: string[]) {
  const def = TOWER_INFO[kind];
  return def.coinUnlock === 0 || playerLevel >= def.unlockLevel || purchased.includes(kind);
}

export function incomeCost(level: number) {
  return Math.round(50 * Math.pow(1.8, level - 1));
}
export function incomePerSecond(level: number) {
  return 2 + (level - 1) * 2.5;
}

export type GameState = {
  gold: number;
  baseHp: number;
  baseMaxHp: number;
  stageId: number;
  stageWaveTarget: number;
  wave: number;
  waveTimer: number;
  spawnQueue: number;
  spawnTimer: number;
  kills: number;
  towersPlaced: number;
  income: number;
  incomeLevel: number;
  zombies: Zombie[];
  bullets: Bullet[];
  gibs: Gib[];
damagePopups: DamagePopup[];
waveMessage: string;
waveMessageLife: number;
waveMessageType: "start" | "complete" | "boss" | "";
  runModifierOffer: RunModifierDefinition[];
  activeRunModifiers: RunModifierId[];
  killStreak: number;
  killStreakTimer: number;
  screenShake: number;
towers: Tower[];
  gameOver: boolean;
  stageWon: boolean;
  flash: number;
};

type StageRunConfig = Pick<
  StageDefinition,
  | "id"
  | "startingCoins"
  | "startingBaseHealth"
  | "waveCount"
  | "enemyPool"
  | "gameplay"
  | "boss"
  | "rewardMultiplier"
  | "specialRules"
  | "rewards"
  | "objectives"
>;


const DEFAULT_STAGE: StageRunConfig = {
  id: 1,
  startingCoins: 180,
  startingBaseHealth: 20,
  waveCount: 6,
  enemyPool: { normalKinds: [0, 1], weights: { walker: 0.8, runner: 0.2 } },
  gameplay: {
    waveDifficultyMultiplier: 1,
    waveSizeMultiplier: 1,
    spawnIntervalMultiplier: 1,
    waveDelayMultiplier: 1,
    enemySpeedMultiplier: 1,
    enemyHealthMultiplier: 1,
  },
  boss: { enabled: false, wave: null, kind: null, count: 0 },
  rewardMultiplier: 1,
  specialRules: [],
  rewards: {
    completionCoins: 0,
    completionXp: 0,
    completionStars: 0,
    firstCompletionBonus: { coins: 0, xp: 0, stars: 0 },
  },
  objectives: [],
};

function makeState(stage: StageRunConfig): GameState {
  return {
    gold: stage.startingCoins,
    baseHp: stage.startingBaseHealth,
    baseMaxHp: stage.startingBaseHealth,
    stageId: stage.id,
    stageWaveTarget: Math.max(1, stage.waveCount),
    wave: 0,
    waveTimer: 0.6,
    spawnQueue: 0,
    spawnTimer: 0,
    kills: 0,
    towersPlaced: 0,
    income: 0,
    incomeLevel: 1,
    zombies: [],
    bullets: [],
   gibs: [],
damagePopups: [],
waveMessage: "",
waveMessageLife: 0,
waveMessageType: "",
    runModifierOffer: [],
    activeRunModifiers: [],
    killStreak: 0,
    killStreakTimer: 0,
    screenShake: 0,
    towers: [],
    gameOver: false,
    stageWon: false,
    flash: 0,
  };
}

export class Game {
  private readonly random: RandomSource;
  private nextId = 1;

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  state: GameState = makeState(DEFAULT_STAGE);
  private stage: StageRunConfig = DEFAULT_STAGE;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }
reset() {
  this.nextId = 1;
  this.state = makeState(this.stage);
  this.emit();
}

 startStage(stage: StageRunConfig) {
  this.stage = stage;
  this.nextId = 1;
  this.state = makeState(stage);
  this.emit();
}

  chooseRunModifier(id: RunModifierId): boolean {
    const state = this.state;
    const chosen = state.runModifierOffer.find((entry) => entry.id === id);
    if (!chosen) return false;
    state.activeRunModifiers = [...state.activeRunModifiers, id];
    state.runModifierOffer = [];
    state.waveMessage = chosen.name.toUpperCase() + " ACTIVE";
    state.waveMessageLife = 1.4;
    state.waveMessageType = "complete";
    track("modifier_chosen", { modifier: id, wave: state.wave });
    const plan = getWaveSpawnPlan(state.wave, state.stageWaveTarget);
    const queueMult =
      Math.max(0.8, this.stage.gameplay.waveSizeMultiplier) *
      Math.max(0.8, this.stage.gameplay.waveDifficultyMultiplier);
    const bossWave = this.stage.boss.enabled && this.stage.boss.wave === state.wave;
    const bossCount = bossWave ? Math.max(0, this.stage.boss.count) : 0;
    const queue = Math.floor((4 + state.wave * 1.5) * queueMult * plan.sizeMultiplier) + bossCount;
    state.spawnQueue = Math.min(64, Math.max(1, queue));
    state.spawnTimer = 0;
    state.waveTimer = plan.clearDelay * Math.max(0.55, this.stage.gameplay.waveDelayMultiplier);
    sfx("upgrade");
    this.emit();
    return true;
  }

  towerAtSpot(spot: number) {
    return this.state.towers.find((t) => t.spot === spot) ?? null;
  }

  setTowerTargetMode(towerId: number, mode: TargetMode): boolean {
    const tower = this.state.towers.find((t) => t.id === towerId);

    if (!tower) return false;

    tower.targetMode = mode;
    this.emit();
    return true;
  }

  build(spot: number, kind: TowerKind): boolean {
    const s = this.state;
    const pad = BUILD_SPOTS[spot];
    if (!pad || this.towerAtSpot(spot)) return false;
    const p = profile.profile;
    if (!towerUnlocked(kind, p.level, p.unlockedTowers)) {
      sfx("deny");
      return false;
    }
    const cost = TOWER_INFO[kind].cost;
    if (s.gold < cost) {
      sfx("deny");
      return false;
    }
    s.gold -= cost;
    s.towers.push({
      id: this.nextId++,
      kind,
      spot,
      x: pad.x,
      z: pad.z,
      level: 1,
      a: 0,
      b: 0,
      targetMode: "first",
      cooldown: 0,
      aim: 0,
      recoil: 0,
    });
    s.towersPlaced += 1;
    profile.recordTowerBuilt(kind);
    track("tower_built", { kind });
    sfx("build");
    this.emit();
    return true;
  }

  /** Straight level-up: costs gold, raises damage / rate / range. */
  upgradeTower(towerId: number): boolean {
    const s = this.state;
    const t = s.towers.find((x) => x.id === towerId);
    if (!t || t.level >= MAX_TOWER_LEVEL) {
      sfx("deny");
      return false;
    }
    const cost = towerUpgradeCost(t);
    if (s.gold < cost) {
      sfx("deny");
      return false;
    }
    s.gold -= cost;
    t.level += 1;
    profile.recordTowerUpgrade(t.kind);
    track("tower_upgraded", { kind: t.kind, level: t.level });
    sfx("upgrade");
    this.emit();
    return true;
  }

  buyProfileTowerUpgrade(kind: TowerKind): boolean {
    const cost = towerProfileUpgradeCost(kind);
    if (!Number.isFinite(cost) || !profile.buyTowerUpgrade(kind, cost)) {
      sfx("deny");
      return false;
    }
    sfx("upgrade");
    this.emit();
    return true;
  }

  unlockTower(kind: TowerKind): boolean {
    const cost = TOWER_INFO[kind].coinUnlock;
    if (cost <= 0 || !profile.unlockTower(kind, cost)) {
      sfx("deny");
      return false;
    }
    sfx("build");
    this.emit();
    return true;
  }

  sell(towerId: number) {
    const s = this.state;
    const i = s.towers.findIndex((t) => t.id === towerId);
    if (i < 0) return;
    s.gold += towerSellValue(s.towers[i]!);
    s.towers.splice(i, 1);
    sfx("build");
    this.emit();
  }

  buyTier(towerId: number, path: "a" | "b") {
    const s = this.state;
    const t = s.towers.find((x) => x.id === towerId);
    if (!t || !canBuyTier(t, path)) {
      sfx("deny");
      return;
    }
    const cost = tierCost(t, path);
    if (s.gold < cost) {
      sfx("deny");
      return;
    }
    s.gold -= cost;
    if (path === "a") t.a += 1;
    else t.b += 1;
    profile.recordTowerUpgrade(t.kind);
    sfx("upgrade");
    this.emit();
  }

  upgradeIncome() {
    const s = this.state;
    const cost = incomeCost(s.incomeLevel);
    if (s.gold < cost) {
      sfx("deny");
      return;
    }
    s.gold -= cost;
    s.incomeLevel += 1;
    sfx("upgrade");
    this.emit();
  }

  repair() {
    const s = this.state;
    if (s.baseHp >= s.baseMaxHp) return;
    const cost = 30;
    if (s.gold < cost) {
      sfx("deny");
      return;
    }
    s.gold -= cost;
    s.baseHp = Math.min(s.baseMaxHp, s.baseHp + 5);
    sfx("upgrade");
    this.emit();
  }

  private waveEndNotified = false;

  private beginNextWave() {
    this.waveEndNotified = false;
    const s = this.state;
    s.wave += 1;

    const bossWave = this.stage.boss.enabled && this.stage.boss.wave === s.wave;
    s.waveMessage = bossWave ? `BOSS WAVE ${s.wave}` : `WAVE ${s.wave}`;
    s.waveMessageLife = 2.2;
    s.waveMessageType = bossWave ? "boss" : "start";

    if (shouldOfferRunModifier(s.wave)) {
      s.runModifierOffer = createRunModifierOffer(this.random, s.activeRunModifiers);
      if (s.runModifierOffer.length > 0) {
        s.waveMessage = "CHOOSE YOUR POWER";
        s.waveMessageLife = 999;
        s.waveMessageType = "complete";
        profile.recordWaveReached(s.wave);
        sfx("wave");
        this.emit();
        return;
      }
    }

    const bossCount = bossWave ? Math.max(0, this.stage.boss.count) : 0;
    const queueMult =
      Math.max(0.8, this.stage.gameplay.waveSizeMultiplier) *
      Math.max(0.8, this.stage.gameplay.waveDifficultyMultiplier);
    const plan = getWaveSpawnPlan(s.wave, s.stageWaveTarget);
    const queue = Math.floor((4 + s.wave * 1.5) * queueMult * plan.sizeMultiplier) + bossCount;
    s.spawnQueue = Math.min(64, Math.max(1, queue));
    s.spawnTimer = 0;
    s.waveTimer = plan.clearDelay * Math.max(0.55, this.stage.gameplay.waveDelayMultiplier);
    profile.recordWaveReached(s.wave);
    sfx("wave");
    this.emit();
  }

  private spawn() {
    const s = this.state;
    const w = s.wave;
    const kind = chooseEnemyKind(
      this.stage.enemyPool,
      this.stage.boss,
      w,
      this.state.stageWaveTarget,
      this.random,
    );
    const { hp, speed } = getEnemySpawnStats(
      this.stage.gameplay,
      kind,
      w,
      this.state.stageWaveTarget,
    );
    s.zombies.push({
      id: this.nextId++,
      dist: -this.random() * 2,
      hp,
      maxHp: hp,
      speed,
      kind,
      x: PATH[0]!.x,
      y: 0,
      z: PATH[0]!.z,
      wobble: this.random() * 10,
      dead: false,
      fade: 0,
      flash: 0,
      slow: 0,
      burn: 0,
      burnTime: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      tilt: 0,
      spin: 0,
      roll: 0,
      gibbed: false,
    });
  }

  /** Shared damage application — used by bullets, splash, chains and burning. */
  /** Shared damage application — used by bullets, splash, chains and burning. */
  private damage(
    z: Zombie,
    dmg: number,
    fromX: number,
    fromZ: number,
    goreBase: number,
    goldMult = 1,
  ) {
    const s = this.state;
    if (z.dead) return;

    const result = resolveDamage(z.hp, z.maxHp, dmg, goreBase, goldMult);
    z.hp = result.nextHp;

    if (s.damagePopups.length < 80) {
      s.damagePopups.push({
        id: this.nextId++,
        x: z.x + (this.random() - 0.5) * 0.45,
        y: 1.35 + this.random() * 0.35,
        z: z.z + (this.random() - 0.5) * 0.45,
        value: result.popupValue,
        life: 0,
        crit: result.crit,
        gold: 0,
      });
    }

    if (!result.killed) {
      z.flash = 1;
      const feedback = getCombatFeedback({
        killed: false,
        crit: result.crit,
        exploded: false,
        killStreak: s.killStreak,
      });
      s.screenShake = Math.min(1.5, s.screenShake + feedback.shake);
      if (dmg >= 0.5) sfx(feedback.hitSound);
      return;
    }

    z.dead = true;
    z.fade = 0;
    s.kills += 1;
    s.killStreak = s.killStreakTimer > 0 ? s.killStreak + 1 : 1;
    s.killStreakTimer = 2.25;
    const goldMultiplier = getRunModifierEffects(s.activeRunModifiers).goldMultiplier;
    s.gold += Math.round(result.killGold * goldMultiplier);
    const feedback = getCombatFeedback({
      killed: true,
      crit: result.crit,
      exploded: result.explode,
      killStreak: s.killStreak,
    });
    s.screenShake = Math.min(1.8, s.screenShake + feedback.shake);

    if (s.damagePopups.length < 80) {
      s.damagePopups.push({
        id: this.nextId++,
        x: z.x,
        y: 1.65,
        z: z.z,
        value: 0,
        life: 0,
        crit: true,
        gold: result.killGold,
      });
    }

    profile.recordZombieKill(z.kind);
    const away = Math.atan2(z.x - fromX, z.z - fromZ);
    const force = result.force;
    z.vx = Math.sin(away) * 2.2 * force;
    z.vz = Math.cos(away) * 2.2 * force;
    z.vy = 2.5 + this.random() * 2 * force;
    z.spin = (this.random() - 0.5) * 9 * force;

    if (result.explode) {
      z.gibbed = true;
      this.spawnGibs(z, 8, Math.min(2.2, force));
      sfx("gib");
    } else {
      this.spawnGibs(z, 3, 0.8);
      sfx(feedback.hitSound);
    }

    this.emit();
  }

    private spawnGibs(z: Zombie, count: number, force: number) {
    const s = this.state;
    if (s.gibs.length > 160) return;

    for (let i = 0; i < count; i++) {
      const a = this.random() * Math.PI * 2;
      const sp = (1.5 + this.random() * 3) * force;

      s.gibs.push({
        id: this.nextId++,
        x: z.x,
        y: 0.6 + this.random() * 0.9,
        z: z.z,
        vx: Math.cos(a) * sp,
        vy: 2.5 + this.random() * 3.5 * force,
        vz: Math.sin(a) * sp,
        rx: this.random() * 3,
        ry: this.random() * 3,
        spin: (this.random() - 0.5) * 14,
        life: 0,
        size: 0.12 + this.random() * 0.16,
        tint: i % 3,
      });
    }
  }

  /** Frame-rate independent entry point: runs fixed sim steps for the elapsed time. */
  tick(dtRaw: number) {
    if (this.state.gameOver) return;
    // Cap catch-up so a long tab stall can't fast-forward the whole run.
    this.accumulator += Math.min(Math.max(dtRaw, 0), 0.5);
    const STEP = 1 / 60;
    let steps = 0;
    while (this.accumulator >= STEP && steps < 30) {
      this.accumulator -= STEP;
      steps++;
      this.step(STEP);
      if (this.state.gameOver) {
        this.accumulator = 0;
        break;
      }
    }
  }

  private accumulator = 0;

  private step(dt: number) {
    const s = this.state;
    if (s.gameOver) return;
    if (s.runModifierOffer.length > 0) return;
    if (s.killStreakTimer > 0) {
      s.killStreakTimer = Math.max(0, s.killStreakTimer - dt);
      if (s.killStreakTimer === 0) s.killStreak = 0;
    }
    s.screenShake = Math.max(0, s.screenShake - dt * 6);
    if (s.waveMessageLife > 0) {
      s.waveMessageLife -= dt;
      if (s.waveMessageLife <= 0) {
        s.waveMessageLife = 0;
        s.waveMessage = "";
        s.waveMessageType = "";
      }
    }

for (let i = s.damagePopups.length - 1; i >= 0; i--) {
  const popup = s.damagePopups[i]!;

  popup.life += dt;
  popup.y += dt * (1.15 + popup.life * 0.15);

  if (popup.life >= 0.9) {
    s.damagePopups.splice(i, 1);
  }
}


    // idle income
    s.income += incomePerSecond(s.incomeLevel) * dt;
    if (s.income >= 1) {
      const whole = Math.floor(s.income);
      s.gold += whole;
      s.income -= whole;
    }

    // waves
    if (s.spawnQueue > 0) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const plan = getWaveSpawnPlan(s.wave, s.stageWaveTarget);
        const burst = Math.min(s.spawnQueue, plan.batchSize);
        for (let i = 0; i < burst; i++) {
          this.spawn();
          s.spawnQueue -= 1;
        }
        const spawnIntervalMult = Math.max(0.6, this.stage.gameplay.spawnIntervalMultiplier);
        s.spawnTimer = Math.max(
          0.12,
          (0.85 - s.wave * 0.02) * spawnIntervalMult * plan.intervalMultiplier,
        );
      }
    }

    // zombies
    for (const z of s.zombies) {
      if (z.flash > 0) z.flash = Math.max(0, z.flash - dt * 4);

      if (z.dead) {
        const ragdoll = stepEnemyRagdoll(
          {
            fade: z.fade,
            x: z.x,
            y: z.y,
            z: z.z,
            vx: z.vx,
            vy: z.vy,
            vz: z.vz,
            tilt: z.tilt,
            spin: z.spin,
            roll: z.roll,
          },
          dt,
        );
        z.fade = ragdoll.fade;
        z.x = ragdoll.x;
        z.y = ragdoll.y;
        z.z = ragdoll.z;
        z.vx = ragdoll.vx;
        z.vy = ragdoll.vy;
        z.vz = ragdoll.vz;
        z.tilt = ragdoll.tilt;
        z.spin = ragdoll.spin;
        z.roll = ragdoll.roll;
        continue;
      }

      const lifecycle = stepLivingEnemy({
        dist: z.dist,
        speed: z.speed,
        slow: z.slow,
        burn: z.burn,
        burnTime: z.burnTime,
        wobble: z.wobble,
        dt,
        pathLength: PATH_LENGTH,
      });

      z.wobble = lifecycle.wobble;
      z.burnTime = lifecycle.burnTime;

      if (lifecycle.burnDamage > 0) {
        this.damage(z, lifecycle.burnDamage, z.x, z.z, 1);
        if (z.dead) continue;
      }

      z.burn = lifecycle.burn;
      z.dist = lifecycle.dist;
      z.slow = lifecycle.slow;

      const p = pointAt(z.dist);
      z.x = p.x;
      z.z = p.z;

      if (lifecycle.reachedBase) {
        z.dead = true;
        z.fade = 1.4;
        const baseHit = resolveBaseHit(s.baseHp, z.kind);
        s.baseHp = baseHit.nextHealth;
        s.flash = 1;
        sfx("baseHit");
        if (baseHit.gameOver) {
          s.gameOver = true;
          profile.completeRun(Math.max(1, s.wave), s.kills, {
            stageId: this.stage.id,
            stageCompleted: false,
            starsEarned: 0,
            bonusCoins: 0,
            bonusXp: 0,
            rewardMultiplier: this.stage.rewardMultiplier,
          });
          sfx("gameOver");
        }
        this.emit();
      }
    }

    const aliveZombies = s.zombies.some((z) => !z.dead);

    if (
      !s.gameOver &&
      isStageWinReady(s.wave, s.stageWaveTarget, s.spawnQueue, aliveZombies)
    ) {
      s.gameOver = true;
      s.stageWon = true;
      const stars = evaluateStageObjectives(this.stage.objectives, {
        stageCompleted: true,
        baseHealth: s.baseHp,
        baseMaxHealth: s.baseMaxHp,
        towersPlaced: s.towersPlaced,
      }).stars;
      profile.completeRun(Math.max(1, s.wave), s.kills, {
        stageId: this.stage.id,
        stageCompleted: true,
        starsEarned: stars,
        bonusCoins: this.stage.rewards.completionCoins,
        bonusXp: this.stage.rewards.completionXp,
        bonusStars: this.stage.rewards.completionStars,
        firstCompletionBonus: this.stage.rewards.firstCompletionBonus,
        rewardMultiplier: this.stage.rewardMultiplier,
      });
      sfx("wave");
      this.emit();
    } else if (
      !s.gameOver &&
      s.wave < s.stageWaveTarget &&
      s.spawnQueue === 0 &&
      !aliveZombies
    ) {
      if (!this.waveEndNotified) {
        this.waveEndNotified = true;
        s.waveMessage = "WAVE COMPLETE!";
        s.waveMessageLife = Math.max(1.5, s.waveTimer);
        s.waveMessageType = "complete";
        sfx("wave");
        this.emit();
      }
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) {
        this.beginNextWave();
      }
    }


    // gibs
    for (const g of s.gibs) {
      g.life += dt;
      g.vy -= 18 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;
      g.rx += g.spin * dt;
      g.ry += g.spin * 0.7 * dt;
      if (g.y < 0.06) {
        g.y = 0.06;
        g.vy = Math.abs(g.vy) > 1 ? -g.vy * 0.25 : 0;
        g.vx *= Math.exp(-7 * dt);
        g.vz *= Math.exp(-7 * dt);
        g.spin *= Math.exp(-7 * dt);
      }
    }
    // towers
    const runEffects = getRunModifierEffects(s.activeRunModifiers);
    for (const t of s.towers) {
      const cooldown = advanceTowerCooldown(t.cooldown, dt);
      t.cooldown = cooldown.cooldown;
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);

      const best = selectTowerTarget(s.zombies, t, towerRange(t) * runEffects.rangeMultiplier, t.targetMode);
      if (best) {
        t.aim = Math.atan2(best.x - t.x, best.z - t.z);
        if (cooldown.ready) {
          const rate = towerRate(t) * runEffects.rateMultiplier;
          t.cooldown = 1 / rate;
          t.recoil = 1;
          const crit = this.random() < towerCrit(t);

          s.bullets.push(
            createTowerProjectile({
              id: this.nextId++,
              x: t.x,
              z: t.z,
              tx: best.x,
              tz: best.z,
              speed: BULLET_SPEED[t.kind],
              damage: towerDamage(t) * runEffects.damageMultiplier * (crit ? 2.5 : 1),
              target: best.id,
              kind: t.kind,
              splash: towerSplash(t) * runEffects.splashMultiplier,
              chain: towerChain(t),
              slow: towerSlow(t) * runEffects.slowMultiplier,
              burn: towerBurn(t),
              gold: towerGold(t),
              crit,
              level: t.level,
            }),
          );
          sfx(SHOOT_SFX[t.kind]);
        }
      }
    }

    // bullets
    for (const b of s.bullets) {
      const target = b.alive
        ? s.zombies.find((z) => z.id === b.target && !z.dead) ?? null
        : null;
      const flight = stepProjectile(b, dt, target);

      b.tx = flight.tx;
      b.tz = flight.tz;
      b.x = flight.x;
      b.z = flight.z;
      b.alive = flight.alive;

      if (flight.impacted && target) {
        const goreBase = GORE_BASE[b.kind];
        const hit = (z: Zombie, dmg: number) => {
          const status = applyProjectileStatusEffects(
            z,
            b.slow,
            b.burn,
          );
          z.slow = status.slow;
          z.burn = status.burn;
          z.burnTime = status.burnTime;
          this.damage(z, dmg, b.x, b.z, goreBase, b.gold);
        };

        hit(target, b.damage);

        const splashTargets = getSplashTargets(
          s.zombies,
          target.id,
          target.x,
          target.z,
          b.splash,
        );
        for (const z of splashTargets) {
          hit(z, b.damage * PROJECTILE_SPLASH_DAMAGE_MULTIPLIER);
        }

        const chainTargets = getChainTargets(
          s.zombies,
          target.id,
          target.x,
          target.z,
          b.chain,
        );
        for (const z of chainTargets) {
          hit(z, b.damage * PROJECTILE_CHAIN_DAMAGE_MULTIPLIER);
        }
      }
    }

    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2);

    // cleanup
    if (s.zombies.length > 0) {
      s.zombies = s.zombies.filter((z) => !shouldDespawnEnemy(z.dead, z.fade));
    }
    if (s.bullets.length > 0) {
      s.bullets = s.bullets.filter((b) => b.alive);
    }
    if (s.gibs.length > 0) {
      s.gibs = s.gibs.filter((g) => g.life < 3.2);
    }
  }
}

export const game = new Game();
