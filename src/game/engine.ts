// Pure game simulation for the idle tower defense game.
// No React, no three.js — just numbers the renderer reads each frame.

import { sfx } from "./audio";
import { profile } from "./profile";

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

export type TowerKind =
  | "rifleman"
  | "shotgunner"
  | "sniper"
  | "tesla"
  | "flamethrower"
  | "freezer"
  | "rocket"
  | "laser";

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

export type Tower = {
  id: number;
  kind: TowerKind;
  spot: number;
  x: number;
  z: number;
  level: number; // 1..MAX_TOWER_LEVEL, bought with gold
  a: number; // tiers bought in path A (0-4)
  b: number; // tiers bought in path B (0-4)
  cooldown: number;
  aim: number;
  recoil: number;
};

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

/** Gold cost of the next level-up for this tower. */
export function towerUpgradeCost(t: Tower) {
  if (t.level >= MAX_TOWER_LEVEL) return Infinity;
  return Math.round(TOWER_INFO[t.kind].upgradeBase * Math.pow(1.55, t.level - 1));
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
        { name: "Long Barrel", desc: "+25% range, +15% damage", cost: 50, mods: { range: 1.25, dmg: 1.15 } },
        { name: "Scope", desc: "+20% range, 20% crit chance", cost: 110, mods: { range: 1.2, crit: 0.2 } },
        { name: "Hollow Points", desc: "+60% damage, 30% crit", cost: 240, mods: { dmg: 1.6, crit: 0.3 } },
        { name: "Deadeye", desc: "+120% damage, wide reach", cost: 520, mods: { dmg: 2.2, range: 1.25, crit: 0.4, gore: 1.5 } },
      ],
    },
    b: {
      name: "Suppressor",
      focus: "Rate of fire",
      tiers: [
        { name: "Quick Hands", desc: "+40% fire rate", cost: 45, mods: { rate: 1.4 } },
        { name: "Drum Mag", desc: "+45% fire rate", cost: 100, mods: { rate: 1.45 } },
        { name: "Twin Barrels", desc: "+60% rate, +25% damage", cost: 230, mods: { rate: 1.6, dmg: 1.25 } },
        { name: "Minigun", desc: "+120% rate, more gold per kill", cost: 500, mods: { rate: 2.2, dmg: 1.2, gold: 1.25 } },
      ],
    },
  },
  rocket: {
    a: {
      name: "Siege Artillery",
      focus: "Range & slowing shrapnel",
      tiers: [
        { name: "Long Gun", desc: "+30% range", cost: 80, mods: { range: 1.3 } },
        { name: "Tar Shells", desc: "Shots slow zombies 35%", cost: 170, mods: { slow: 0.35, splash: 0.6 } },
        { name: "Cluster Shot", desc: "+1.4 blast radius, +25% damage", cost: 340, mods: { splash: 1.4, dmg: 1.25 } },
        { name: "Bombardier", desc: "+45% range, 55% slow, huge blast", cost: 720, mods: { range: 1.45, slow: 0.55, splash: 1.8, dmg: 1.3 } },
      ],
    },
    b: {
      name: "Point Blank",
      focus: "Pure close-range killing",
      tiers: [
        { name: "Packed Powder", desc: "+70% damage, -10% range", cost: 85, mods: { dmg: 1.7, range: 0.9 } },
        { name: "Rapid Loader", desc: "+55% fire rate", cost: 180, mods: { rate: 1.55 } },
        { name: "Siege Slugs", desc: "+110% damage", cost: 360, mods: { dmg: 2.1 } },
        { name: "Meat Grinder", desc: "+180% damage, gibs everything", cost: 760, mods: { dmg: 2.8, rate: 1.3, gore: 2.5 } },
      ],
    },
  },
  freezer: {
    a: {
      name: "Deep Freeze",
      focus: "Crowd control",
      tiers: [
        { name: "Chill Mist", desc: "Slow 45%, small blast", cost: 65, mods: { slow: 0.45, splash: 1 } },
        { name: "Wide Nozzle", desc: "+30% range, bigger blast", cost: 140, mods: { range: 1.3, splash: 1 } },
        { name: "Cryo Core", desc: "Slow 62%, +50% rate", cost: 290, mods: { slow: 0.62, rate: 1.5 } },
        { name: "Absolute Zero", desc: "Slow 75% in a huge radius", cost: 600, mods: { slow: 0.75, splash: 1.6, range: 1.25 } },
      ],
    },
    b: {
      name: "Shatter",
      focus: "Damage on frozen flesh",
      tiers: [
        { name: "Ice Shards", desc: "+90% damage", cost: 70, mods: { dmg: 1.9 } },
        { name: "Frostbite", desc: "+70% damage, 20% crit", cost: 150, mods: { dmg: 1.7, crit: 0.2 } },
        { name: "Brittle Bones", desc: "+90% damage, 35% crit", cost: 310, mods: { dmg: 1.9, crit: 0.35 } },
        { name: "Shatterstorm", desc: "+150% damage, bodies explode", cost: 640, mods: { dmg: 2.5, rate: 1.3, gore: 2.2 } },
      ],
    },
  },
  tesla: {
    a: {
      name: "Chain Coil",
      focus: "Hitting the whole horde",
      tiers: [
        { name: "Extra Arc", desc: "+1 chain target", cost: 100, mods: { chain: 1, splash: 0.4 } },
        { name: "Conductors", desc: "+30% range, +1 chain", cost: 210, mods: { range: 1.3, chain: 1 } },
        { name: "Storm Net", desc: "+2 chains, +25% damage", cost: 420, mods: { chain: 2, dmg: 1.25, splash: 0.6 } },
        { name: "Tempest", desc: "+3 chains, +40% range", cost: 880, mods: { chain: 3, range: 1.4, dmg: 1.3 } },
      ],
    },
    b: {
      name: "Overload",
      focus: "Raw single-target power",
      tiers: [
        { name: "Capacitors", desc: "+80% damage", cost: 95, mods: { dmg: 1.8 } },
        { name: "Fast Discharge", desc: "+60% fire rate", cost: 200, mods: { rate: 1.6 } },
        { name: "Arc Furnace", desc: "+110% damage, 25% crit", cost: 400, mods: { dmg: 2.1, crit: 0.25 } },
        { name: "Annihilator", desc: "+200% damage, vaporizes bodies", cost: 840, mods: { dmg: 3, rate: 1.25, gore: 3 } },
      ],
    },
  },
  shotgunner: {
    a: {
      name: "Riot Spread",
      focus: "Crowd shredding",
      tiers: [
        { name: "Wide Choke", desc: "+0.8 blast radius", cost: 60, mods: { splash: 0.8 } },
        { name: "Buckshot", desc: "+45% damage, bigger spread", cost: 130, mods: { dmg: 1.45, splash: 0.6 } },
        { name: "Dragon's Breath", desc: "Shots set zombies alight", cost: 280, mods: { burn: 6, splash: 0.6 } },
        { name: "Riot Storm", desc: "+90% damage, huge spread", cost: 590, mods: { dmg: 1.9, splash: 1.4, gore: 2 } },
      ],
    },
    b: {
      name: "Executioner",
      focus: "Point-blank stopping power",
      tiers: [
        { name: "Slug Rounds", desc: "+75% damage, -15% spread", cost: 65, mods: { dmg: 1.75, splash: -0.4 } },
        { name: "Pump Grip", desc: "+50% fire rate", cost: 140, mods: { rate: 1.5 } },
        { name: "Breacher", desc: "+90% damage, 25% crit", cost: 300, mods: { dmg: 1.9, crit: 0.25 } },
        { name: "Gore Cannon", desc: "+170% damage, gibs everything", cost: 620, mods: { dmg: 2.7, rate: 1.25, gore: 2.6 } },
      ],
    },
  },
  sniper: {
    a: {
      name: "Overwatch",
      focus: "Reach across the map",
      tiers: [
        { name: "Bipod", desc: "+25% range", cost: 90, mods: { range: 1.25 } },
        { name: "Rangefinder", desc: "+20% range, 25% crit", cost: 200, mods: { range: 1.2, crit: 0.25 } },
        { name: "Match Barrel", desc: "+70% damage, +15% range", cost: 400, mods: { dmg: 1.7, range: 1.15 } },
        { name: "God's Eye", desc: "+150% damage, 45% crit", cost: 850, mods: { dmg: 2.5, crit: 0.45, range: 1.2, gore: 1.8 } },
      ],
    },
    b: {
      name: "Anti-Materiel",
      focus: "Killing big targets fast",
      tiers: [
        { name: "Quick Bolt", desc: "+45% fire rate", cost: 95, mods: { rate: 1.45 } },
        { name: "Heavy Rounds", desc: "+80% damage", cost: 210, mods: { dmg: 1.8 } },
        { name: "Explosive Tips", desc: "+1.6 blast radius", cost: 430, mods: { splash: 1.6, dmg: 1.2 } },
        { name: "Brute Breaker", desc: "+200% damage, wrecks brutes", cost: 900, mods: { dmg: 3, rate: 1.2, gore: 2.4 } },
      ],
    },
  },
  flamethrower: {
    a: {
      name: "Inferno",
      focus: "Burning damage over time",
      tiers: [
        { name: "Hot Fuel", desc: "+6 burn damage per second", cost: 70, mods: { burn: 6 } },
        { name: "Sticky Napalm", desc: "+9 burn, bigger cone", cost: 150, mods: { burn: 9, splash: 0.5 } },
        { name: "Firestorm", desc: "+14 burn, +30% range", cost: 320, mods: { burn: 14, range: 1.3 } },
        { name: "Hellmouth", desc: "+26 burn, everything cooks", cost: 660, mods: { burn: 26, splash: 0.8, gore: 2.2 } },
      ],
    },
    b: {
      name: "Pressure Tank",
      focus: "Raw output on groups",
      tiers: [
        { name: "Wide Cone", desc: "+0.7 spread, +20% range", cost: 75, mods: { splash: 0.7, range: 1.2 } },
        { name: "High Pressure", desc: "+45% fire rate", cost: 160, mods: { rate: 1.45 } },
        { name: "Twin Nozzles", desc: "+90% damage", cost: 330, mods: { dmg: 1.9 } },
        { name: "Purifier", desc: "+160% damage, huge cone", cost: 680, mods: { dmg: 2.6, splash: 1.2, rate: 1.2 } },
      ],
    },
  },
  laser: {
    a: {
      name: "Focus Array",
      focus: "Single-target annihilation",
      tiers: [
        { name: "Tight Beam", desc: "+70% damage", cost: 170, mods: { dmg: 1.7 } },
        { name: "Prism Lens", desc: "+55% damage, 25% crit", cost: 360, mods: { dmg: 1.55, crit: 0.25 } },
        { name: "Fusion Core", desc: "+90% damage, +20% range", cost: 700, mods: { dmg: 1.9, range: 1.2 } },
        { name: "Deathray", desc: "+220% damage, vaporizes bodies", cost: 1400, mods: { dmg: 3.2, crit: 0.4, gore: 3 } },
      ],
    },
    b: {
      name: "Scatter Optics",
      focus: "Cutting through crowds",
      tiers: [
        { name: "Beam Splitter", desc: "+1 chain target", cost: 165, mods: { chain: 1 } },
        { name: "Refraction", desc: "+2 chains, +25% range", cost: 350, mods: { chain: 2, range: 1.25 } },
        { name: "Thermal Bloom", desc: "Beams ignite for 18/s", cost: 680, mods: { burn: 18, splash: 0.6 } },
        { name: "Starfall", desc: "+3 chains, +80% damage", cost: 1350, mods: { chain: 3, dmg: 1.8, rate: 1.2 } },
      ],
    },
  },
};


/** Classic rule: only one path may go past tier 2. */
export function canBuyTier(t: Tower, path: "a" | "b") {
  const mine = path === "a" ? t.a : t.b;
  const other = path === "a" ? t.b : t.a;
  if (mine >= 4) return false;
  if (mine >= 2 && other >= 3) return false;
  return true;
}

export function tierCost(t: Tower, path: "a" | "b") {
  const mine = path === "a" ? t.a : t.b;
  if (mine >= 4) return Infinity;
  return TOWER_PATHS[t.kind][path].tiers[mine]!.cost;
}

function mods(t: Tower): Required<Mods> {
  const out = { dmg: 1, rate: 1, range: 1, slow: 0, splash: 0, chain: 0, crit: 0, gold: 1, gore: 1, burn: 0 };
  const apply = (p: "a" | "b", n: number) => {
    const tiers = TOWER_PATHS[t.kind][p].tiers;
    for (let i = 0; i < n; i++) {
      const m = tiers[i]!.mods;
      if (m.dmg) out.dmg *= m.dmg;
      if (m.rate) out.rate *= m.rate;
      if (m.range) out.range *= m.range;
      if (m.slow) out.slow = Math.max(out.slow, m.slow);
      if (m.splash) out.splash += m.splash;
      if (m.chain) out.chain += m.chain;
      if (m.crit) out.crit = Math.max(out.crit, m.crit);
      if (m.gold) out.gold *= m.gold;
      if (m.gore) out.gore = Math.max(out.gore, m.gore);
      if (m.burn) out.burn = Math.max(out.burn, m.burn);
    }
  };
  apply("a", t.a);
  apply("b", t.b);
  return out;
}

/** Flat level bonuses bought with the Upgrade button. */
function levelDmg(t: Tower) {
  return Math.pow(1.22, t.level - 1);
}
function levelRate(t: Tower) {
  return Math.pow(1.06, t.level - 1);
}
function levelRange(t: Tower) {
  return Math.pow(1.035, t.level - 1);
}

/** Total tiers bought across both paths (used for visuals). */
export function towerTiers(t: Tower) {
  return t.a + t.b;
}
export function towerLevel(t: Tower) {
  return t.level;
}
export function towerDamage(t: Tower) {
  return TOWER_INFO[t.kind].damage * mods(t).dmg * levelDmg(t);
}
export function towerRange(t: Tower) {
  return TOWER_INFO[t.kind].range * mods(t).range * levelRange(t);
}
export function towerRate(t: Tower) {
  return TOWER_INFO[t.kind].rate * mods(t).rate * levelRate(t);
}
export function towerSlow(t: Tower) {
  return Math.max(TOWER_INFO[t.kind].slow ?? 0, mods(t).slow);
}
export function towerSplash(t: Tower) {
  return Math.max(0, (TOWER_INFO[t.kind].splash ?? 0) + mods(t).splash);
}
export function towerChain(t: Tower) {
  return (TOWER_INFO[t.kind].chain ?? 0) + mods(t).chain;
}
export function towerBurn(t: Tower) {
  return Math.max(TOWER_INFO[t.kind].burn ?? 0, mods(t).burn) * levelDmg(t);
}
export function towerCrit(t: Tower) {
  return mods(t).crit;
}
export function towerGore(t: Tower) {
  return mods(t).gore;
}
export function towerGold(t: Tower) {
  return mods(t).gold;
}
export function towerSellValue(t: Tower) {
  let spent = TOWER_INFO[t.kind].cost;
  const tiersA = TOWER_PATHS[t.kind].a.tiers;
  const tiersB = TOWER_PATHS[t.kind].b.tiers;
  for (let i = 0; i < t.a; i++) spent += tiersA[i]!.cost;
  for (let i = 0; i < t.b; i++) spent += tiersB[i]!.cost;
  for (let l = 1; l < t.level; l++) {
    spent += Math.round(TOWER_INFO[t.kind].upgradeBase * Math.pow(1.55, l - 1));
  }
  return Math.floor(spent * 0.6);
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
  wave: number;
  waveTimer: number;
  spawnQueue: number;
  spawnTimer: number;
  kills: number;
  income: number;
  incomeLevel: number;
  zombies: Zombie[];
  bullets: Bullet[];
  gibs: Gib[];
  towers: Tower[];
  gameOver: boolean;
  flash: number;
};

let nextId = 1;

function makeState(): GameState {
  return {
    gold: 180,
    baseHp: 20,
    baseMaxHp: 20,
    wave: 0,
    waveTimer: 10,
    spawnQueue: 0,
    spawnTimer: 0,
    kills: 0,
    income: 0,
    incomeLevel: 1,
    zombies: [],
    bullets: [],
    gibs: [],
    towers: [],
    gameOver: false,
    flash: 0,
  };
}

export class Game {
  state: GameState = makeState();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  reset() {
    this.state = makeState();
    this.emit();
  }

  towerAtSpot(spot: number) {
    return this.state.towers.find((t) => t.spot === spot) ?? null;
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
      id: nextId++,
      kind,
      spot,
      x: pad.x,
      z: pad.z,
      level: 1,
      a: 0,
      b: 0,
      cooldown: 0,
      aim: 0,
      recoil: 0,
    });
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
    sfx("upgrade");
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

  private spawn() {
    const s = this.state;
    const w = s.wave;
    const roll = Math.random();
    const kind: 0 | 1 | 2 = w > 3 && roll > 0.88 ? 2 : w > 1 && roll > 0.65 ? 1 : 0;
    const baseHp = 16 * Math.pow(1.22, w - 1);
    const hp = kind === 2 ? baseHp * 3.2 : kind === 1 ? baseHp * 0.7 : baseHp;
    const speed = kind === 2 ? 0.85 : kind === 1 ? 2.2 : 1.3;
    s.zombies.push({
      id: nextId++,
      dist: -Math.random() * 2,
      hp,
      maxHp: hp,
      speed,
      kind,
      x: PATH[0]!.x,
      y: 0,
      z: PATH[0]!.z,
      wobble: Math.random() * 10,
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

  private spawnGibs(z: Zombie, count: number, force: number) {
    const s = this.state;
    if (s.gibs.length > 160) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (1.5 + Math.random() * 3) * force;
      s.gibs.push({
        id: nextId++,
        x: z.x,
        y: 0.6 + Math.random() * 0.9,
        z: z.z,
        vx: Math.cos(a) * sp,
        vy: 2.5 + Math.random() * 3.5 * force,
        vz: Math.sin(a) * sp,
        rx: Math.random() * 3,
        ry: Math.random() * 3,
        spin: (Math.random() - 0.5) * 14,
        life: 0,
        size: 0.12 + Math.random() * 0.16,
        tint: i % 3,
      });
    }
  }

  tick(dtRaw: number) {
    const s = this.state;
    const dt = Math.min(dtRaw, 0.05);
    if (s.gameOver) return;

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
        this.spawn();
        s.spawnQueue -= 1;
        s.spawnTimer = Math.max(0.35, 1.1 - s.wave * 0.03);
      }
    } else {
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) {
        s.wave += 1;
        s.spawnQueue = 4 + Math.floor(s.wave * 1.6);
        s.spawnTimer = 0;
        s.waveTimer = 14 + s.wave * 0.5;
        sfx("wave");
        this.emit();
      }
    }

    // zombies
    for (const z of s.zombies) {
      if (z.flash > 0) z.flash = Math.max(0, z.flash - dt * 4);
      if (z.dead) {
        // ragdoll
        z.fade += dt * 0.55;
        z.vy -= 16 * dt;
        z.y += z.vy * dt;
        z.x += z.vx * dt;
        z.z += z.vz * dt;
        z.tilt += z.spin * dt;
        z.roll += z.spin * 0.6 * dt;
        if (z.y <= 0) {
          z.y = 0;
          if (z.vy < -0.4) {
            z.vy = -z.vy * 0.3;
            z.spin *= 0.4;
          } else {
            z.vy = 0;
            z.spin *= Math.exp(-8 * dt);
          }
          z.vx *= Math.exp(-6 * dt);
          z.vz *= Math.exp(-6 * dt);
        }
        continue;
      }
      z.wobble += dt * (4 + z.speed * 2);
      if (z.burnTime > 0 && z.burn > 0) {
        z.burnTime -= dt;
        this.damage(z, z.burn * dt, z.x, z.z, 1);
        if (z.dead) continue;
        if (z.burnTime <= 0) z.burn = 0;
      }
      z.dist += z.speed * dt * (1 - Math.min(0.85, z.slow));
      z.slow = 0;

      const p = pointAt(z.dist);
      z.x = p.x;
      z.z = p.z;
      if (z.dist >= PATH_LENGTH) {
        z.dead = true;
        z.fade = 1.4;
        s.baseHp -= z.kind === 2 ? 3 : 1;
        s.flash = 1;
        sfx("baseHit");
        if (s.baseHp <= 0) {
          s.baseHp = 0;
          s.gameOver = true;
          profile.completeRun(Math.max(1, s.wave), s.kills);
          sfx("gameOver");
        }
        this.emit();
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
    for (const t of s.towers) {
      t.cooldown -= dt;
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);
      const range = towerRange(t);
      let best: Zombie | null = null;
      let bestDist = Infinity;
      for (const z of s.zombies) {
        if (z.dead) continue;
        const d = Math.hypot(z.x - t.x, z.z - t.z);
        if (d <= range && PATH_LENGTH - z.dist < bestDist) {
          bestDist = PATH_LENGTH - z.dist;
          best = z;
        }
      }
      if (best) {
        t.aim = Math.atan2(best.x - t.x, best.z - t.z);
        if (t.cooldown <= 0) {
          t.cooldown = 1 / towerRate(t);
          t.recoil = 1;
          const crit = Math.random() < towerCrit(t);
          s.bullets.push({
            id: nextId++,
            x: t.x,
            z: t.z,
            y: 1.6 + t.level * 0.03,
            tx: best.x,
            tz: best.z,
            speed: BULLET_SPEED[t.kind],
            damage: towerDamage(t) * (crit ? 2.5 : 1),
            target: best.id,
            kind: t.kind,
            splash: towerSplash(t),
            chain: towerChain(t),
            slow: towerSlow(t),
            burn: towerBurn(t),
            crit,
            alive: true,
          });
          sfx(SHOOT_SFX[t.kind]);
        }
      }
    }

    // bullets
    for (const b of s.bullets) {
      if (!b.alive) continue;
      const target = s.zombies.find((z) => z.id === b.target && !z.dead);
      if (target) {
        b.tx = target.x;
        b.tz = target.z;
      }
      const dx = b.tx - b.x;
      const dz = b.tz - b.z;
      const d = Math.hypot(dx, dz);
      const step = b.speed * dt;
      if (d <= step || !target) {
        b.alive = false;
        if (target) {
          const goreBase = GORE_BASE[b.kind];
          const hit = (z: Zombie, dmg: number) => {
            if (b.slow > 0) z.slow = Math.max(z.slow, b.slow);
            if (b.burn > 0) {
              z.burn = Math.max(z.burn, b.burn);
              z.burnTime = Math.max(z.burnTime, 2.4);
            }
            this.damage(z, dmg, b.x, b.z, goreBase);
          };
          hit(target, b.damage);
          const splash = b.splash;
          if (splash > 0) {
            for (const z of s.zombies) {
              if (z.dead || z.id === target.id) continue;
              if (Math.hypot(z.x - target.x, z.z - target.z) < splash) hit(z, b.damage * 0.5);
            }
          }
          if (b.chain > 0) {
            let hits = 0;
            for (const z of s.zombies) {
              if (hits >= b.chain) break;
              if (z.dead || z.id === target.id) continue;
              if (Math.hypot(z.x - target.x, z.z - target.z) < 3.4) {
                hit(z, b.damage * 0.6);
                hits += 1;
              }
            }
          }
        }
      } else {
        b.x += (dx / d) * step;
        b.z += (dz / d) * step;
      }
    }


    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2);

    // cleanup
    if (s.zombies.length > 0) {
      s.zombies = s.zombies.filter((z) => !(z.dead && z.fade > 1.6));
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
