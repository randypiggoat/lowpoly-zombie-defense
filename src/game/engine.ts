// Pure game simulation for the idle tower defense game.
// No React, no three.js — just numbers the renderer reads each frame.

import { sfx } from "./audio";
import {
  campaignReplayProgressKey,
  evaluateStageObjectives,
  type CampaignReplayChallengeDefinition,
  type StageDefinition,
  type StageEnemyKind,
} from "./navigation";
import { chooseEnemyKind, getEnemySpawnStats } from "./enemySpawns";
import { resolveDamage } from "./damage";
import { getTowerCombatStats } from "./towerStats";
import { isStageWinReady, resolveBaseHit } from "./stageOutcomes";
import { getChainTargets, getSplashTargets } from "./projectileImpact";
import { applyProjectileStatusEffects } from "./projectileEffects";
import {
  advanceTowerCooldown,
  createTowerProjectile,
  KILL_RUSH_DURATION,
  chainJumpMultiplier,
  conditionalDamageMultiplier,
  PROJECTILE_SPLASH_DAMAGE_MULTIPLIER,
  stepProjectile,
} from "./towerCombat";
import { stepEnemyRagdoll, stepLivingEnemy, shouldDespawnEnemy } from "./enemyLifecycle";
import {
  canBuyTier as canBuyTowerTier,
  tierCost as getTowerTierCost,
  towerSellValue as calculateTowerSellValue,
} from "./towerActions";
import { selectTowerTarget } from "./targeting";
import { profile } from "./profile";
import { createBossTrialStage, type BossTrialDefinition } from "./bossTrials";
import type { SideModeLevel } from "./sideModes";
import type { RandomSource } from "./random";
import { getWaveSpawnPlan } from "./waves";
import { getCombatFeedback } from "./combatFeel";
import { isKillStreakMilestone, killStreakGoldMultiplier } from "./combatRewards";
import {
  applyRunModifiersToCombat,
  createRunModifierOffer,
  getRunModifierDamageMultiplier,
  getRunModifierEffects,
  shouldOfferRunModifier,
  type RunModifierDefinition,
  type RunModifierId,
} from "./runModifiers";
import { towerEnemyDamageMultiplier } from "./towerCounterplay";
import { perfectWaveGoldBonus } from "./waveRewards";
import { bossKillGoldMultiplier } from "./bossRewards";
import { bossSpeedMultiplier, shouldBossEnrage } from "./bossBehavior";
import { calculateKillReward } from "./rewardSummary";
import { track } from "./analytics";
import { createEndlessStage, type EndlessChallenge } from "./endless";
import {
  canPlaceTower,
  getPathLength,
  getStageMap,
  getStageMapByStageId,
  placementKey,
  snapBuildPosition,
  pointAtPath,
} from "./maps";
import {
  deathGorePartsForKind,
  goreAnchor,
  gorePartBit,
  gorePartsBrokenBetween,
  type GorePart,
} from "./enemyGore";
import {
  TOWER_PATHS as DESIGNED_TOWER_PATHS,
  getTowerUpgradeAbilities,
} from "./towerUpgradeDesign";
import { damageReactionMultiplier, hitDirection } from "./zombiePresentation";
import { isTowerUnlocked as isProgressionTowerUnlocked, towerUnlockLevel } from "./progression";

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
  kind: StageEnemyKind; // walker, runner, brute, splitter, bomber, guardian, healer, swarm
  boss: boolean;
  bossEnraged: boolean;
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
  /** Seconds of remaining stun (zombie holds position) and mark (extra damage taken). */
  stun?: number;
  markTime?: number;
  markBonus?: number;
  /** Radius a burning death spreads fire across (set by Wildfire / Scald). */
  burnSpread?: number;
  healTimer?: number;
  healFlash?: number;
  // ragdoll
  vx: number;
  vy: number;
  vz: number;
  tilt: number;
  spin: number;
  roll: number;
  gibbed: boolean;
  /** Bit mask of body/signature pieces already broken off by damage. */
  gibMask?: number;
  /** Lightweight render-facing combat reaction state. */
  hitReact: number;
  hitX: number;
  hitZ: number;
  hitForce: number;
  hitKind?: TowerKind;
  stun?: number;
  markTime?: number;
  markBonus?: number;
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
  part?: GorePart;
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
  level: number; // 1..MAX_TOWER_LEVEL, derived from SCRAP path tiers
  a: number; // tiers bought in path A (0-4)
  b: number; // tiers bought in path B (0-4)
  targetMode: TargetMode;
  cooldown: number;
  /** Cached targeting state; refreshed periodically to avoid repeated LOS scans every simulation step. */
  targetId?: number;
  targetRefreshTimer?: number;
  aim: number;
  recoil: number;
  /** Seconds left of a kill-rush fire-rate surge. */
  surge?: number;
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
  originX: number;
  originZ: number;
  stun: number;
  markDuration: number;
  markBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
  markedDamageMultiplier: number;
  slowedDamageMultiplier: number;
  stunnedMultiplier?: number;
  burningMultiplier?: number;
  swarmMultiplier?: number;
  burnSpread?: number;
  chainEscalation?: number;
  eliteDamageMultiplier?: number;
  precisionMultiplier?: number;
  fastDamageMultiplier?: number;
  killRush?: number;
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
    unlockLevel: 3,
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
    unlockLevel: 5,
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
    unlockLevel: 7,
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
    unlockLevel: 9,
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
    unlockLevel: 12,
    coinUnlock: 1600,
    shape: "lens",
  },
};

export const MAX_TOWER_LEVEL = 8;
export const MAX_ACTIVE_BULLETS = 64;

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
  "shootRifle" | "shootShotgun" | "shootSniper" | "shootTesla" | "shootFlame" | "shootFrost" | "shootRocket" | "shootLaser"
> = {
  rifleman: "shootRifle",
  shotgunner: "shootShotgun",
  sniper: "shootSniper",
  tesla: "shootTesla",
  flamethrower: "shootFlame",
  freezer: "shootFrost",
  rocket: "shootRocket",
  laser: "shootLaser",
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
export type Tier = {
  name: string;
  desc: string;
  cost: number;
  mods: Mods;
  ability?: string;
};

export const TOWER_PATHS = DESIGNED_TOWER_PATHS;

/** Classic rule: only one path may go past tier 2. */
export function canBuyTier(t: Tower, path: "a" | "b") {
  return canBuyTowerTier(t, path);
}

export function tierCost(t: Tower, path: "a" | "b") {
  const raw = getTowerTierCost(t, path, TOWER_PATHS[t.kind]);
  return Number.isFinite(raw)
    ? Math.max(1, Math.round(raw * profile.fieldKnowledgeEffects().towerUpgradeCostMultiplier))
    : raw;
}

function towerCombatStats(t: Tower) {
  return getTowerCombatStats(
    t,
    TOWER_INFO[t.kind],
    TOWER_PATHS[t.kind],
    towerProfileBonus(t.kind),
  );
}
export function towerUpgradeAbilities(t: Tower) {
  return getTowerUpgradeAbilities(t.kind as keyof typeof DESIGNED_TOWER_PATHS, t.a, t.b);
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
  const raw = calculateTowerSellValue(
    t,
    TOWER_INFO[t.kind],
    TOWER_PATHS[t.kind],
    MAX_TOWER_LEVEL,
  );
  return Math.floor(raw * profile.fieldKnowledgeEffects().sellMultiplier);
}

export function towerBuildCost(kind: TowerKind) {
  return Math.max(
    1,
    Math.round(
      TOWER_INFO[kind].cost * profile.fieldKnowledgeEffects().towerBuildCostMultiplier,
    ),
  );
}

export function towerProfileBonus(_kind: TowerKind) {
  const knowledge = profile.fieldKnowledgeEffects();
  return {
    level: 0,
    damage: knowledge.damageMultiplier,
    rate: knowledge.rateMultiplier,
    range: knowledge.rangeMultiplier,
  };
}

/** Whether the player's progression allows building this tower. */
export function towerUnlocked(kind: TowerKind, playerLevel: number, purchased: string[]) {
  return isProgressionTowerUnlocked(kind, playerLevel, purchased);
}

export function towerUnlockLevelForProgression(kind: TowerKind) {
  return towerUnlockLevel(kind);
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
  simulationSpeed: 1 | 2;
  spawnQueue: number;
  spawnTimer: number;
  kills: number;
  waveDamageTaken: number;
  maxKillStreak: number;
  uniqueTowerKinds: string[];
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
  runModifierRerollUsed: boolean;
  reviveUsed: boolean;
  bossesRemaining: number;
  perfectWaves: number;
  perfectWaveBonusGold: number;
  streakBonusGold: number;
  bossBonusGold: number;
  bossesDefeated: number;
  bossEnragedCount: number;
  killStreak: number;
  killStreakTimer: number;
  screenShake: number;
  endlessMode: boolean;
  challengeId: string | null;
  challengeName: string | null;
  challengePeriod: "free" | "daily" | "weekly" | null;
  challengeKey: string | null;
  bossTrial: boolean;
  bossTrialId: string | null;
  bossTrialName: string | null;
  bossTrialKey: string | null;
  bossTrialBossKind: StageEnemyKind | null;
  bossTrialScore: number;
  gameMode: "campaign" | "endless" | "boss-trial" | "resource-ops" | "challenge" | "event";
  sideModeId: string | null;
  sideModeName: string | null;
  sideModeLevel: number | null;
  sideModeCycleKey: string | null;
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
  | "mapId"
> & {
  endless?: boolean;
  challenge?: EndlessChallenge;
  challengeKey?: string;
  bossTrial?: BossTrialDefinition;
  bossTrialKey?: string;
  allowRunModifiers?: boolean;
  campaignReplayChallenge?: CampaignReplayChallengeDefinition;
  sideMode?: SideModeLevel;
  sideModeCycleKey?: string;
};


function waveQueueSize(
  wave: number,
  waveTarget: number,
  queueMultiplier: number,
  planMultiplier: number,
  bossCount: number,
) {
  const progress = Math.max(0, (wave - 1) / Math.max(1, waveTarget - 1));
  const baseQueue =
    4 +
    Math.round(progress * 12) +
    Math.floor(Math.max(0, wave - 1) / 10);
  return Math.min(
    64,
    Math.max(1, Math.floor(baseQueue * queueMultiplier * planMultiplier) + bossCount),
  );
}

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
  mapId: "neighborhood",
  allowRunModifiers: true,
};

function makeState(stage: StageRunConfig): GameState {
  return {
    gold: stage.startingCoins + profile.fieldKnowledgeEffects().startingScrap,
    baseHp: stage.startingBaseHealth + profile.fieldKnowledgeEffects().baseHealth,
    baseMaxHp: stage.startingBaseHealth + profile.fieldKnowledgeEffects().baseHealth,
    stageId: stage.id,
    stageWaveTarget: Math.max(1, stage.waveCount),
    wave: 0,
    waveTimer: 0.6,
    simulationSpeed: 1,
    spawnQueue: 0,
    spawnTimer: 0,
    kills: 0,
    waveDamageTaken: 0,
    maxKillStreak: 0,
    uniqueTowerKinds: [],
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
    runModifierRerollUsed: false,
    reviveUsed: false,
    bossesRemaining: 0,
    perfectWaves: 0,
    perfectWaveBonusGold: 0,
    streakBonusGold: 0,
    bossBonusGold: 0,
    bossesDefeated: 0,
    bossEnragedCount: 0,
    killStreak: 0,
    killStreakTimer: 0,
    screenShake: 0,
    endlessMode: Boolean(stage.endless),
    challengeId: stage.challenge?.id ?? null,
    challengeName: stage.challenge?.name ?? null,
    challengePeriod: stage.challenge?.period ?? null,
    challengeKey: stage.challengeKey ?? null,
    bossTrial: Boolean(stage.bossTrial),
    bossTrialId: stage.bossTrial?.id ?? null,
    bossTrialName: stage.bossTrial?.variant?.name ?? stage.bossTrial?.title ?? null,
    bossTrialKey: stage.bossTrialKey ?? null,
    bossTrialBossKind: stage.bossTrial?.bossKind ?? null,
    bossTrialScore: 0,
    gameMode: stage.sideMode?.category === "resource"
      ? "resource-ops"
      : stage.sideMode?.category === "challenge"
        ? "challenge"
        : stage.sideMode?.category === "event"
          ? "event"
          : stage.bossTrial
            ? "boss-trial"
            : stage.endless
              ? "endless"
              : "campaign",
    sideModeId: stage.sideMode?.id ?? null,
    sideModeName: stage.sideMode?.name ?? null,
    sideModeLevel: stage.sideMode?.level ?? null,
    sideModeCycleKey: stage.sideModeCycleKey ?? null,
    towers: [],
    gameOver: false,
    stageWon: false,
    flash: 0,
  };
}

export class Game {
  private readonly random: RandomSource;
  private nextId = 1;
  private projectileEmissions = 0;
  private map = getStageMapByStageId(DEFAULT_STAGE.id);
  private pathLength = PATH_LENGTH;

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  state: GameState = makeState(DEFAULT_STAGE);
  private stage: StageRunConfig = DEFAULT_STAGE;
  private listeners = new Set<() => void>();

  getProjectileEmissionCount() {
    return this.projectileEmissions;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }
  private resetTransientState() {
    this.accumulator = 0;
    this.waveEndNotified = false;
  }

  private completeCampaignReplayChallenge(completed: boolean) {
    const challenge = this.stage.campaignReplayChallenge;
    if (!challenge) return;
    const s = this.state;
    const score = Math.max(
      0,
      Math.round(
        s.wave * 120 +
          s.kills * 8 +
          s.baseHp * 20 +
          s.maxKillStreak * 6 +
          s.bossesDefeated * 350 +
          1200,
      ),
    );
    const progressKey = campaignReplayProgressKey(this.stage.id, challenge.id);
    this.flushMasteryKills();
    profile.completeSideModeRun(
      progressKey,
      Math.max(1, s.wave),
      s.kills,
      score,
      challenge.reward,
      challenge.firstClearBonus,
      completed,
    );
  }

  reset() {
    this.nextId = 1;
    this.projectileEmissions = 0;
    this.resetTransientState();
    this.state = makeState(this.stage);
    this.emit();
  }

  startStage(stage: StageRunConfig) {
    this.projectileEmissions = 0;
    this.stage = stage;
    this.map = getStageMap(stage.mapId);
    this.pathLength = getPathLength(this.map.path);
    this.nextId = 1;
    this.resetTransientState();
    this.state = makeState(stage);
    track("run_started", { stageId: stage.id, endless: false });
  this.emit();
}

 startEndless(challenge: EndlessChallenge, challengeKey = new Date().toISOString().slice(0, 10)) {
  this.projectileEmissions = 0;
  const stage = createEndlessStage(challenge);
  this.stage = { ...stage, challenge, challengeKey, endless: true };
  this.map = getStageMap(stage.mapId);
  this.pathLength = getPathLength(this.map.path);
  this.nextId = 1;
  this.resetTransientState();
  this.state = makeState(this.stage);
  track("run_started", { stageId: stage.id, endless: true, challenge: challenge.id });
  this.emit();
}

  startBossTrial(trial: BossTrialDefinition, weekKey: string) {
    this.projectileEmissions = 0;
    const stage = createBossTrialStage(trial);
    this.stage = { ...stage, bossTrial: trial, bossTrialKey: weekKey, allowRunModifiers: false };
    this.map = getStageMap(stage.mapId);
    this.pathLength = getPathLength(this.map.path);
    this.nextId = 1;
    this.resetTransientState();
    this.state = makeState(this.stage);
    track("boss_trial_started", {
      trial: trial.id,
      bossKind: trial.bossKind,
      weekKey,
    });
    this.emit();
  }

  startSideMode(level: SideModeLevel, cycleKey = new Date().toISOString().slice(0, 10)) {
    this.projectileEmissions = 0;
    this.stage = {
      ...level.stage,
      sideMode: level,
      sideModeCycleKey: cycleKey,
      allowRunModifiers: false,
    };
    this.map = getStageMap(level.stage.mapId);
    this.pathLength = getPathLength(this.map.path);
    this.nextId = 1;
    this.resetTransientState();
    this.state = makeState(this.stage);
    track("side_mode_started", { mode: level.category, levelId: level.id, cycleKey });
    this.emit();
  }


  reviveRun(): boolean {
    const state = this.state;
    if (!state.gameOver || state.stageWon || state.reviveUsed || state.baseHp > 0) return false;

    state.reviveUsed = true;
    state.gameOver = false;
    state.baseHp = Math.max(1, Math.ceil(state.baseMaxHp * 0.5));
    state.killStreak = 0;
    state.killStreakTimer = 0;
    state.waveMessage = "SECOND CHANCE!";
    state.waveMessageLife = 2;
    state.waveMessageType = "complete";
    state.flash = 0;
    track("revive_used", { wave: state.wave });
    sfx("upgrade");
    this.emit();
    return true;
  }

  rerollRunModifierOffer(): boolean {
    const state = this.state;
    if (state.runModifierOffer.length === 0 || state.runModifierRerollUsed) return false;
    const excluded = [
      ...state.activeRunModifiers,
      ...state.runModifierOffer.map((entry) => entry.id),
    ];
    const offer = createRunModifierOffer(this.random, excluded);
    if (offer.length === 0) return false;
    state.runModifierOffer = offer;
    state.runModifierRerollUsed = true;
    track("modifier_rerolled", { wave: state.wave });
    sfx("upgrade");
    this.emit();
    return true;
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
    const endlessBossWave =
      Boolean(this.stage.endless) && state.wave >= 10 && state.wave % 10 === 0;
    const bossWave =
      endlessBossWave ||
      (this.stage.boss.enabled && this.stage.boss.wave === state.wave);
    const bossCount = endlessBossWave
      ? 1 + Math.floor(state.wave / 30)
      : bossWave
        ? Math.max(0, this.stage.boss.count)
        : 0;
    state.bossesRemaining = bossCount;
    const queue = waveQueueSize(
      state.wave,
      state.stageWaveTarget,
      queueMult,
      plan.sizeMultiplier,
      bossCount,
    );
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

  setSimulationSpeed(speed: 1 | 2) {
    this.state.simulationSpeed = speed;
    this.emit();
  }

  setTowerTargetMode(towerId: number, mode: TargetMode): boolean {
    const tower = this.state.towers.find((t) => t.id === towerId);

    if (!tower) return false;

    tower.targetMode = mode;
    tower.targetId = undefined;
    tower.targetRefreshTimer = 0;
    this.emit();
    return true;
  }

  private placeTowerAt(x: number, z: number, kind: TowerKind, spot: number) {
    const s = this.state;
    const p = profile.profile;
    if (!towerUnlocked(kind, p.level, p.unlockedTowers)) {
      sfx("deny");
      return false;
    }
    const allowedTowerKinds =
      this.stage.campaignReplayChallenge?.allowedTowerKinds ?? this.stage.sideMode?.allowedTowerKinds;
    if (allowedTowerKinds && !allowedTowerKinds.includes(kind)) {
      sfx("deny");
      return false;
    }
    const maxTowers = this.stage.campaignReplayChallenge?.maxTowers ?? this.stage.sideMode?.maxTowers;
    if (maxTowers !== undefined && s.towers.length >= maxTowers) {
      sfx("deny");
      return false;
    }
    const cost = towerBuildCost(kind);
    if (s.gold < cost) {
      sfx("deny");
      return false;
    }
    s.gold -= cost;
    s.towers.push({
      id: this.nextId++,
      kind,
      spot,
      x,
      z,
      level: 1,
      a: 0,
      b: 0,
      targetMode: "first",
      cooldown: 0,
      aim: 0,
      targetId: undefined,
      targetRefreshTimer: 0,
      recoil: 0,
    });
    s.towersPlaced += 1;
    if (!s.uniqueTowerKinds.includes(kind)) s.uniqueTowerKinds.push(kind);
    profile.recordTowerBuilt(kind);
    track("tower_built", { kind });
    sfx("build");
    this.emit();
    return true;
  }

  /**
   * Legacy indexed build used by existing saves/tests. New gameplay uses buildAt()
   * so towers can occupy any legal ground position.
   */
  build(spot: number, kind: TowerKind): boolean {
    const pad = BUILD_SPOTS[spot];
    if (!pad || this.towerAtSpot(spot)) return false;
    // Keep the indexed API for legacy callers/tests. Gameplay now uses buildAt().
    return this.placeTowerAt(pad.x, pad.z, kind, spot);
  }

  getPlacementStatus(x: number, z: number) {
    return canPlaceTower(this.map, x, z, this.state.towers);
  }

  buildAt(x: number, z: number, kind: TowerKind): boolean {
    const point = snapBuildPosition(this.map, x, z);
    const placement = canPlaceTower(this.map, point.x, point.z, this.state.towers);
    if (!placement.valid) {
      sfx("deny");
      return false;
    }
    const spot = placementKey(point.x, point.z);
    if (this.towerAtSpot(spot)) {
      sfx("deny");
      return false;
    }
    return this.placeTowerAt(point.x, point.z, kind, spot);
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
    t.level = Math.min(MAX_TOWER_LEVEL, 1 + t.a + t.b);
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
    s.waveDamageTaken = 0;

    const endlessBossWave =
      Boolean(this.stage.endless) && s.wave >= 10 && s.wave % 10 === 0;
    const bossWave =
      endlessBossWave || (this.stage.boss.enabled && this.stage.boss.wave === s.wave);
    s.waveMessage = bossWave ? `BOSS WAVE ${s.wave}` : `WAVE ${s.wave}`;
    s.waveMessageLife = 2.2;
    s.waveMessageType = bossWave ? "boss" : "start";

    if (
      this.stage.campaignReplayChallenge?.allowRunModifiers !== false &&
      this.stage.allowRunModifiers !== false &&
      shouldOfferRunModifier(s.wave)
    ) {
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
    s.bossesRemaining = bossCount;
    const queueMult =
      Math.max(0.8, this.stage.gameplay.waveSizeMultiplier) *
      Math.max(0.8, this.stage.gameplay.waveDifficultyMultiplier);
    const plan = getWaveSpawnPlan(s.wave, s.stageWaveTarget);
    const queue = waveQueueSize(
      s.wave,
      s.stageWaveTarget,
      queueMult,
      plan.sizeMultiplier,
      bossCount,
    );
    s.spawnQueue = Math.min(64, Math.max(1, queue));
    s.spawnTimer = 0;
    s.waveTimer = plan.clearDelay * Math.max(0.55, this.stage.gameplay.waveDelayMultiplier);
    profile.recordWaveReached(s.wave);
    this.flushMasteryKills();
    sfx("wave");
    this.emit();
  }

  private spawn(
    forcedKind?: StageEnemyKind,
    startDist?: number,
    isBoss = false,
  ): Zombie | null {
    const s = this.state;
    if (s.zombies.length >= 60) return null;
    const w = s.wave;
    const bossConfig = this.stage.endless
      ? {
          enabled: w >= 10 && w % 10 === 0,
          wave: w >= 10 && w % 10 === 0 ? w : null,
          kind: 2 as const,
          count: 1 + Math.floor(w / 30),
        }
      : this.stage.boss;
    const normalSpawnBossConfig = {
      enabled: false,
      wave: null,
      kind: null,
      count: 0,
    } as const;
    const kind =
      forcedKind ??
      (isBoss && bossConfig.kind !== null
        ? bossConfig.kind
        : chooseEnemyKind(
            this.stage.enemyPool,
            normalSpawnBossConfig,
            w,
            this.state.stageWaveTarget,
            this.random,
          ));
    let { hp, speed } = getEnemySpawnStats(
      this.stage.gameplay,
      kind,
      w,
      this.state.stageWaveTarget,
    );
    if (isBoss && this.stage.bossTrial) {
      const traits = this.stage.bossTrial.variant?.traits ?? {};
      hp *= Math.max(0.5, traits.bossHealthMultiplier ?? 1);
      speed *= Math.max(0.5, traits.bossSpeedMultiplier ?? 1);
    }
    hp *= this.runEffects().enemyHealthMultiplier;

    const spawned: Zombie = {
      id: this.nextId++,
      dist: startDist ?? -this.random() * 2,
      hp,
      maxHp: hp,
      speed,
      kind,
      boss: isBoss,
      bossEnraged: false,
      x: this.map.path[0]!.x,
      y: 0,
      z: this.map.path[0]!.z,
      wobble: this.random() * 10,
      dead: false,
      fade: 0,
      flash: 0,
      slow: 0,
      burn: 0,
      burnTime: 0,
      stun: 0,
      markTime: 0,
      markBonus: 0,
      healTimer: 0,
      healFlash: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      tilt: 0,
      spin: 0,
      roll: 0,
      gibbed: false,
      gibMask: 0,
      hitReact: 0,
      hitX: 0,
      hitZ: 0,
      hitForce: 0,
      hitKind: undefined,
    };
    s.zombies.push(spawned);
    this.zombieById.set(spawned.id, spawned);
    return spawned;
  }

  private cachedEffectsKey: RunModifierId[] | null = null;
  private cachedEffects = getRunModifierEffects([]);
  private kindKills: Record<string, number> = {};
  private readonly zombieById = new Map<number, Zombie>();
  private readonly healTargets: Zombie[] = [];
  private readonly splashTargets: Zombie[] = [];
  private readonly chainTargets: Zombie[] = [];

  /** Combined run-modifier effects, recomputed only when the active modifier list changes. */
  private runEffects() {
    const active = this.state.activeRunModifiers;
    if (this.cachedEffectsKey !== active) {
      this.cachedEffectsKey = active;
      this.cachedEffects = getRunModifierEffects(active);
    }
    return this.cachedEffects;
  }

  /** Flush per-tower kill counts into persistent tower mastery (once per wave, not per kill). */
  private flushMasteryKills() {
    if (Object.keys(this.kindKills).length === 0) return;
    profile.recordTowerKills(this.kindKills);
    this.kindKills = {};
  }

  /** Shared damage application — used by bullets, splash, chains and burning. */
  private damage(
    z: Zombie,
    dmg: number,
    fromX: number,
    fromZ: number,
    goreBase: number,
    goldMult = 1,
    crit = false,
    ability: {
      stun?: number;
      markDuration?: number;
      markBonus?: number;
      shatterMultiplier?: number;
      executeThreshold?: number;
      executeMultiplier?: number;
      bossDamageMultiplier?: number;
      closeDamageMultiplier?: number;
      stunnedMultiplier?: number;
      burningMultiplier?: number;
      eliteDamageMultiplier?: number;
      precisionMultiplier?: number;
      fastDamageMultiplier?: number;
      killRush?: number;
      originX?: number;
      originZ?: number;
      damageKind?: TowerKind;
    } = {},
  ) {
    const s = this.state;
    if (z.dead) return;

    const guardianAura = this.stage.bossTrial && !z.boss && this.stage.bossTrial.variant?.traits.bossAuraDamageReduction
      ? s.zombies.some(
          (other) =>
            other.boss &&
            other.kind === 5 &&
            !other.dead &&
            other.id !== z.id &&
            Math.hypot(other.x - z.x, other.z - z.z) <= 4.2,
        )
        ? Math.max(0, 1 - this.stage.bossTrial.variant.traits.bossAuraDamageReduction)
        : 1
      : 1;
    const guardianShieldBroken = Boolean(z.gibMask && (z.gibMask & gorePartBit("guardian-shield")));
    const markedMultiplier =
      (z.markTime ?? 0) > 0 ? 1 + Math.max(0, z.markBonus ?? ability.markBonus ?? 0) : 1;
    const shatterMultiplier = z.slow > 0 ? Math.max(1, ability.shatterMultiplier ?? 1) : 1;
    const executeMultiplier =
      ability.executeThreshold && z.hp / Math.max(1, z.maxHp) <= ability.executeThreshold
        ? Math.max(1, ability.executeMultiplier ?? 1)
        : 1;
    // A stunning hit counts as already stunning: the stun lands first, so stun→burst pays off immediately.
    const stunnedMultiplier =
      (z.stun ?? 0) > 0 || (ability.stun ?? 0) > 0 ? Math.max(1, ability.stunnedMultiplier ?? 1) : 1;
    const burningMultiplier = z.burn > 0 ? Math.max(1, ability.burningMultiplier ?? 1) : 1;
    const bossMultiplier = z.boss ? Math.max(1, ability.bossDamageMultiplier ?? 1) : 1;
    const originX = ability.originX ?? fromX;
    const originZ = ability.originZ ?? fromZ;
    const closeMultiplier =
      Math.hypot(z.x - originX, z.z - originZ) <= 3.8
        ? Math.max(1, ability.closeDamageMultiplier ?? 1)
        : 1;
    const conditionalMultiplier = conditionalDamageMultiplier({
      enemyKind: z.kind,
      boss: z.boss,
      distanceFromTower: Math.hypot(z.x - originX, z.z - originZ),
      ...(ability.eliteDamageMultiplier !== undefined && { eliteDamageMultiplier: ability.eliteDamageMultiplier }),
      ...(ability.precisionMultiplier !== undefined && { precisionMultiplier: ability.precisionMultiplier }),
      ...(ability.fastDamageMultiplier !== undefined && { fastDamageMultiplier: ability.fastDamageMultiplier }),
    });
    const incomingDamage =
      (z.kind === 5 ? dmg * (guardianShieldBroken ? 0.84 : 0.68) : dmg) *
      guardianAura *
      markedMultiplier *
      shatterMultiplier *
      executeMultiplier *
      bossMultiplier *
      stunnedMultiplier *
      burningMultiplier *
      conditionalMultiplier *
      closeMultiplier;
    const result = resolveDamage(
      z.hp,
      z.maxHp,
      incomingDamage,
      goreBase,
      goldMult,
      crit,
    );
    const previousRatio = Math.max(0, Math.min(1, z.hp / Math.max(1, z.maxHp)));
    z.hp = result.nextHp;
    if (!result.killed) {
      if (ability.stun) z.stun = Math.max(z.stun ?? 0, ability.stun);
      if (ability.markDuration) {
        z.markTime = Math.max(z.markTime ?? 0, ability.markDuration);
        z.markBonus = Math.max(z.markBonus ?? 0, ability.markBonus ?? 0);
      }
    }
    const hit = hitDirection(z.x, z.z, originX, originZ);
    if (hit.x !== 0 || hit.z !== 0) {
      z.hitX = hit.x;
      z.hitZ = hit.z;
    }
    const damageRatio = incomingDamage / Math.max(1, z.maxHp);
    z.hitReact = 1;
    z.hitForce = Math.min(
      1.75,
      (0.28 + damageRatio * 2.2) * damageReactionMultiplier(ability.damageKind),
    );
    z.hitKind = ability.damageKind;

    const nextRatio = Math.max(0, Math.min(1, z.hp / Math.max(1, z.maxHp)));
    const brokenParts = gorePartsBrokenBetween(
      z.kind,
      previousRatio,
      nextRatio,
      z.gibMask ?? 0,
    );
    for (const part of brokenParts) {
      z.gibMask = (z.gibMask ?? 0) | gorePartBit(part);
      this.spawnPartGib(z, part, goreBase, result.crit ? 1.15 : 1);
    }

    // Damage stays in the battlefield; earned SCRAP is the only pickup feedback.
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
    if (ability.damageKind && ability.originX !== undefined) {
      this.kindKills[ability.damageKind] = (this.kindKills[ability.damageKind] ?? 0) + (z.boss ? 10 : 1);
      if (ability.killRush && ability.killRush > 1) {
        for (const tower of s.towers) {
          if (tower.kind === ability.damageKind) tower.surge = KILL_RUSH_DURATION;
        }
      }
    }
    if (z.burn > 0 && z.burnSpread) {
      for (const other of s.zombies) {
        if (other.dead || other.id === z.id) continue;
        if (Math.hypot(other.x - z.x, other.z - z.z) > z.burnSpread) continue;
        other.burn = Math.max(other.burn, z.burn);
        other.burnTime = Math.max(other.burnTime, 2.4);
      }
    }
    s.killStreak = s.killStreakTimer > 0 ? s.killStreak + 1 : 1;
    s.maxKillStreak = Math.max(s.maxKillStreak, s.killStreak);
    s.killStreakTimer = 2.25;
    const knowledge = profile.fieldKnowledgeEffects();
    const runGoldMultiplier = this.runEffects().goldMultiplier * knowledge.scrapMultiplier;
    const streakGoldMultiplier = killStreakGoldMultiplier(s.killStreak);
    const bossGoldMultiplier = bossKillGoldMultiplier(z.boss);
    const reward = calculateKillReward(
      result.killGold,
      runGoldMultiplier,
      streakGoldMultiplier,
      bossGoldMultiplier,
    );
    s.streakBonusGold += reward.streakBonusGold;
    s.bossBonusGold += reward.bossBonusGold;
    s.gold += reward.totalGold;
    const earnedGold = reward.totalGold;
    sfx("coin");
    if (isKillStreakMilestone(s.killStreak)) {
      track("kill_streak_milestone", {
        streak: s.killStreak,
        goldMultiplier: streakGoldMultiplier,
      });
    }
    const feedback = getCombatFeedback({
      killed: true,
      crit: result.crit,
      exploded: result.explode,
      killStreak: s.killStreak,
    });
    s.screenShake = Math.min(1.8, s.screenShake + feedback.shake + (z.boss ? 0.8 : 0));

    if (z.boss) {
      s.bossesDefeated += 1;
      s.waveMessage = `BOSS DOWN! +${earnedGold} SCRAP`;
      s.waveMessageLife = 1.8;
      s.waveMessageType = "complete";
      track("boss_defeated", {
        wave: s.wave,
        kind: z.kind,
        gold: earnedGold,
      });
      sfx("bigHit");
    }

    if (s.damagePopups.length < 24) {
      s.damagePopups.push({
        id: this.nextId++,
        x: z.x,
        y: 1.65,
        z: z.z,
        value: 0,
        life: 0,
        crit: true,
        gold: earnedGold,
      });
    }

    profile.recordZombieKill(z.kind);

    if (z.kind === 3) {
      const trialTraits = this.stage.bossTrial?.variant?.traits;
      const splitCount = z.boss && trialTraits?.bossSplitCount
        ? Math.max(2, Math.floor(trialTraits.bossSplitCount))
        : 2;
      for (let i = 0; i < splitCount; i++) {
        const child = this.spawn(7, Math.max(0, z.dist - 0.2 - i * 0.12), false);
        if (!child) break;
        child.hp *= z.boss && trialTraits?.bossSplitHpMultiplier
          ? Math.max(0.2, trialTraits.bossSplitHpMultiplier)
          : 0.45;
        child.maxHp = child.hp;
      }
    }

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

  }

  private spawnPartGib(z: Zombie, part: GorePart, goreBase: number, force = 1) {
    const s = this.state;
    if (s.gibs.length >= 64) return;
    const anchor = goreAnchor(part);
    const angle = this.random() * Math.PI * 2;
    const speed = (1.25 + this.random() * 2.4) * Math.max(0.7, Math.min(2, goreBase)) * force;
    s.gibs.push({
      id: this.nextId++,
      x: z.x + anchor.x * 0.6,
      y: Math.max(0.18, anchor.y + (this.random() - 0.5) * 0.12),
      z: z.z + anchor.z * 0.6,
      vx: Math.cos(angle) * speed,
      vy: 2.25 + this.random() * 2.8 * force,
      vz: Math.sin(angle) * speed,
      rx: this.random() * 3,
      ry: this.random() * 3,
      spin: (this.random() - 0.5) * 13,
      life: 0,
      size: anchor.size * (0.85 + this.random() * 0.35),
      tint: part === "head" ? 0 : part.includes("core") ? 2 : 1,
      part,
    });
  }

  private spawnGibs(z: Zombie, count: number, force: number) {
    const s = this.state;
    if (s.gibs.length >= 64) return;

    for (let i = 0; i < count; i++) {
      const a = this.random() * Math.PI * 2;
      const sp = (1.1 + this.random() * 2.1) * force;
      const debrisParts = deathGorePartsForKind(z.kind);
      const debrisPart = debrisParts[i % debrisParts.length]!;

      s.gibs.push({
        id: this.nextId++,
        x: z.x,
        y: 0.55 + this.random() * 0.85,
        z: z.z,
        vx: Math.cos(a) * sp,
        vy: 2 + this.random() * 3 * force,
        vz: Math.sin(a) * sp,
        rx: this.random() * 3,
        ry: this.random() * 3,
        spin: (this.random() - 0.5) * 14,
        life: 0,
        size: 0.08 + this.random() * 0.1,
        tint: i % 3,
        part: debrisPart,
      });
    }
  }

  private enemyMobilityMultiplier(z: Zombie) {
    const mask = z.gibMask ?? 0;
    const has = (part: GorePart) => (mask & gorePartBit(part)) !== 0;
    if (z.kind === 1 && (has("left-leg") || has("right-leg"))) return 0.78;
    if (z.kind === 2 && (has("left-shoulder") || has("right-shoulder"))) return 0.9;
    if (z.kind === 3 && has("splitter-core")) return 0.84;
    if (z.kind === 7 && has("swarm-crest")) return 0.8;
    return 1;
  }

  /** Frame-rate independent entry point: runs fixed sim steps for the elapsed time. */
  tick(dtRaw: number) {
    if (this.state.gameOver) return;
    // Cap catch-up so a long tab stall can't fast-forward the whole run.
    const realDt = Math.min(Math.max(dtRaw, 0), 0.5);
    this.accumulator += realDt * this.state.simulationSpeed;
    const STEP = 1 / 60;
    let steps = 0;
    const maxSteps = this.state.simulationSpeed === 2 ? 60 : 30;
    while (this.accumulator >= STEP && steps < maxSteps) {
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

    // Reuse one ID map for the whole simulation step so projectile tracking is O(1)
    // instead of scanning every zombie for every active projectile.
    this.zombieById.clear();
    for (const zombie of s.zombies) {
      this.zombieById.set(zombie.id, zombie);
    }

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


    // Passive income is intentionally quiet so the base is not constantly flashing or chiming.
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
          const spawningBoss =
            s.bossesRemaining > 0 && s.spawnQueue <= s.bossesRemaining;
          this.spawn(undefined, undefined, spawningBoss);
          s.spawnQueue -= 1;
          if (spawningBoss) s.bossesRemaining -= 1;
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
      if (z.hitReact > 0) {
        z.hitReact = Math.max(0, z.hitReact - dt * 7);
        z.hitForce *= Math.exp(-dt * 8);
      }

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

      if (z.healFlash) z.healFlash = Math.max(0, z.healFlash - dt * 4);

      if (
        shouldBossEnrage(
          z.boss,
          z.hp,
          z.maxHp,
          z.bossEnraged,
          this.stage.bossTrial?.variant?.traits.bossEnrageHpRatio,
        )
      ) {
        z.bossEnraged = true;
        s.bossEnragedCount += 1;
        s.waveMessage = "BOSS ENRAGED!";
        s.waveMessageLife = 1.4;
        s.waveMessageType = "boss";
        s.screenShake = Math.min(1.8, s.screenShake + 0.65);
        track("boss_enraged", { wave: s.wave, kind: z.kind });
        sfx("bigHit");
        this.emit();
      }

      if (z.kind === 6) {
        const bossHeal = z.boss && this.stage.bossTrial ? this.stage.bossTrial.variant?.traits : undefined;
        const auraBroken = Boolean(z.gibMask && (z.gibMask & gorePartBit("healer-aura")));

        const healInterval = 0.9 * (bossHeal?.bossHealIntervalMultiplier ?? 1);
        const healAmount = 0.08 * (bossHeal?.bossHealAmountMultiplier ?? 1) * (auraBroken ? 0.42 : 1);
        const targetCount = Math.max(1, Math.floor(bossHeal?.bossHealTargetCount ?? 1));
        z.healTimer = (z.healTimer ?? 0) + dt;
        if (z.healTimer >= healInterval) {
          z.healTimer = 0;
          this.healTargets.length = 0;
          for (const other of s.zombies) {
            if (other.dead || other.id === z.id) continue;
            if (Math.hypot(other.x - z.x, other.z - z.z) > 4.6) continue;
            const missing = other.maxHp - other.hp;
            if (missing <= 0) continue;
            this.healTargets.push(other);
          }
          this.healTargets.sort(
            (a, b) => (b.maxHp - b.hp) - (a.maxHp - a.hp),
          );
          if (this.healTargets.length > targetCount) {
            this.healTargets.length = targetCount;
          }
          for (const target of this.healTargets) {
            const missing = target.maxHp - target.hp;
            if (missing > 0) {
              target.hp = Math.min(target.maxHp, target.hp + target.maxHp * healAmount);
              target.healFlash = 1;
            }
          }
        }
      }

      const lifecycle = stepLivingEnemy({
        dist: z.dist,
        speed:
          z.speed *
          bossSpeedMultiplier(z.boss, z.bossEnraged, this.stage.bossTrial?.variant?.traits.bossEnrageSpeedMultiplier) *
          this.enemyMobilityMultiplier(z),
        slow: z.slow,
        burn: z.burn,
        burnTime: z.burnTime,
        stun: z.stun ?? 0,
        markTime: z.markTime ?? 0,
        wobble: z.wobble,
        dt,
        pathLength: this.pathLength,
      });

      z.wobble = lifecycle.wobble;
      z.burnTime = lifecycle.burnTime;
      z.stun = lifecycle.stun;
      z.markTime = lifecycle.markTime;
      z.markBonus = lifecycle.markBonus;

      if (lifecycle.burnDamage > 0) {
        this.damage(z, lifecycle.burnDamage, z.x, z.z, 1, 1, false, {
          damageKind: "flamethrower",
        });
        if (z.dead) continue;
      }

      z.burn = lifecycle.burn;
      z.dist = lifecycle.dist;
      z.slow = lifecycle.slow;

      const p = pointAtPath(this.map.path, z.dist);
      z.x = p.x;
      z.z = p.z;

      if (lifecycle.reachedBase) {
        z.dead = true;
        z.fade = 1.4;
        const baseHit = resolveBaseHit(s.baseHp, z.kind);
        const rawDamage = s.baseHp - baseHit.nextHealth;
        const bomberPackBroken = Boolean(z.gibMask && (z.gibMask & gorePartBit("bomber-pack")));
        const bomberBaseDamageMultiplier = z.kind === 4 && bomberPackBroken ? 0.55 : 1;
        const bossBaseDamageMultiplier =
          z.boss && this.stage.bossTrial
            ? Math.max(1, this.stage.bossTrial.variant?.traits.bossBaseDamageMultiplier ?? 1)
            : 1;
        const adjustedDamage = Math.ceil(rawDamage * bossBaseDamageMultiplier * bomberBaseDamageMultiplier);
        const nextHealth = Math.max(0, s.baseHp - adjustedDamage);
        s.waveDamageTaken += adjustedDamage;
        s.baseHp = nextHealth;
        s.flash = 1;
        if (z.kind === 4) {
          s.screenShake = Math.min(1.8, s.screenShake + 0.9);
          sfx("gib");
        } else {
          sfx("baseHit");
        }
        if (nextHealth <= 0) {
          s.gameOver = true;
          if (this.stage.bossTrial) {
            const trialScore = Math.max(
              0,
              Math.round(
                s.wave * 120 +
                  s.kills * 10 +
                  s.bossesDefeated * 900 +
                  s.baseHp * 30 +
                  s.maxKillStreak * 6 +
                  (s.bossesDefeated > 0 ? 1000 : 0),
              ),
            );
            s.bossTrialScore = trialScore;
            this.flushMasteryKills();
            profile.completeBossTrial(
              Math.max(1, s.wave),
              s.kills,
              trialScore,
              this.stage.bossTrialKey ?? new Date().toISOString().slice(0, 10),
              false,
              this.stage.rewardMultiplier,
              this.stage.bossTrial.id,
            );
            track("boss_trial_completed", {
              trial: this.stage.bossTrial.id,
              weekKey: this.stage.bossTrialKey ?? "",
              score: trialScore,
              cleared: false,
            });
          } else if (this.stage.campaignReplayChallenge) {
            this.completeCampaignReplayChallenge(false);
          } else if (this.stage.sideMode) {
            const side = this.stage.sideMode;
            const score = Math.max(0, Math.round(
              s.wave * 120 + s.kills * 8 + s.baseHp * 20 + s.maxKillStreak * 6 + s.bossesDefeated * 350,
            ));
            this.flushMasteryKills();
            profile.completeSideModeRun(
              side.id,
              Math.max(1, s.wave),
              s.kills,
              score,
              {
                coins: Math.round(this.stage.rewards.completionCoins * Math.max(0.75, this.stage.rewardMultiplier)),
                xp: Math.round(this.stage.rewards.completionXp * Math.max(0.75, this.stage.rewardMultiplier)),
                gems: side.focus === "gems" ? 3 : 0,
              },
              {
                coins: Math.round(this.stage.rewards.firstCompletionBonus.coins * 0.8),
                xp: Math.round(this.stage.rewards.firstCompletionBonus.xp * 0.8),
                gems: side.focus === "gems" ? 2 : 0,
              },
              false,
            );
            track("side_mode_completed", { mode: side.category, levelId: side.id, score, wave: s.wave, cleared: false });
          } else if (this.stage.endless) {
            this.flushMasteryKills();
            profile.completeEndlessRun(Math.max(1, s.wave), s.kills, {
              challengeId: this.stage.challenge?.id,
              challengePeriod: this.stage.challenge?.period,
              challengeKey: this.stage.challengeKey,
              rewardMultiplier: this.stage.rewardMultiplier,
            });
          } else {
            this.flushMasteryKills();
            profile.completeRun(Math.max(1, s.wave), s.kills, {
              stageId: this.stage.id,
              stageCompleted: false,
              starsEarned: 0,
              bonusCoins: 0,
              bonusXp: 0,
              rewardMultiplier: this.stage.rewardMultiplier,
            });
          }
          sfx("gameOver");
        }
        this.emit();
      }
    }

    const aliveZombies = s.zombies.some((z) => !z.dead);

    if (
      !this.stage.endless &&
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
        maxKillStreak: s.maxKillStreak,
        uniqueTowerKinds: s.uniqueTowerKinds.length,
      }).stars;
      const finalPerfectBonus = perfectWaveGoldBonus(s.wave, s.waveDamageTaken);
      if (this.stage.bossTrial) {
        const trialScore = Math.max(
          0,
          Math.round(
            s.wave * 120 +
              s.kills * 10 +
              s.bossesDefeated * 900 +
              s.baseHp * 30 +
              s.maxKillStreak * 6 +
              1000,
          ),
        );
        s.bossTrialScore = trialScore;
        this.flushMasteryKills();
        profile.completeBossTrial(
          Math.max(1, s.wave),
          s.kills,
          trialScore,
          this.stage.bossTrialKey ?? new Date().toISOString().slice(0, 10),
          true,
          this.stage.rewardMultiplier,
          this.stage.bossTrial.id,
        );
        track("boss_trial_completed", {
          trial: this.stage.bossTrial.id,
          weekKey: this.stage.bossTrialKey ?? "",
          score: trialScore,
          cleared: true,
        });
      } else if (this.stage.campaignReplayChallenge) {
        this.completeCampaignReplayChallenge(true);
      } else if (this.stage.sideMode) {
        const side = this.stage.sideMode;
        const score = Math.max(
          0,
          Math.round(
            s.wave * 120 +
              s.kills * 8 +
              s.baseHp * 20 +
              s.maxKillStreak * 6 +
              s.bossesDefeated * 350 +
              1200,
          ),
        );
        this.flushMasteryKills();
        profile.completeSideModeRun(
          side.id,
          Math.max(1, s.wave),
          s.kills,
          score,
          {
            coins: Math.round(this.stage.rewards.completionCoins * Math.max(0.75, this.stage.rewardMultiplier)),
            xp: Math.round(this.stage.rewards.completionXp * Math.max(0.75, this.stage.rewardMultiplier)),
            gems: side.focus === "gems" ? 3 : 0,
          },
          {
            coins: Math.round(this.stage.rewards.firstCompletionBonus.coins * 0.8),
            xp: Math.round(this.stage.rewards.firstCompletionBonus.xp * 0.8),
            gems: side.focus === "gems" ? 2 : 0,
          },
          true,
        );
        track("side_mode_completed", { mode: side.category, levelId: side.id, score, wave: s.wave, cleared: true });
      } else
      this.flushMasteryKills();
      profile.completeRun(Math.max(1, s.wave), s.kills, {
        stageId: this.stage.id,
        stageCompleted: true,
        starsEarned: stars,
        bonusCoins: this.stage.rewards.completionCoins + finalPerfectBonus,
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
        const perfectBonus = perfectWaveGoldBonus(s.wave, s.waveDamageTaken);
        s.gold += perfectBonus;
        if (perfectBonus > 0) {
          s.perfectWaves += 1;
          s.perfectWaveBonusGold += perfectBonus;
          track("perfect_wave", { wave: s.wave, bonusGold: perfectBonus });
        }
        s.waveMessage =
          perfectBonus > 0 ? `PERFECT WAVE! +${perfectBonus} SCRAP` : "WAVE COMPLETE!";
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
    const runEffects = this.runEffects();
    for (const t of s.towers) {
      const cooldown = advanceTowerCooldown(t.cooldown, dt);
      t.targetRefreshTimer = Math.max(0, (t.targetRefreshTimer ?? 0) - dt);
      t.cooldown = cooldown.cooldown;
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);
      if ((t.surge ?? 0) > 0) t.surge = Math.max(0, (t.surge ?? 0) - dt);

      const range = towerRange(t) * runEffects.rangeMultiplier;
      let best: Zombie | null = null;
      if (t.targetRefreshTimer! > 0 && t.targetId !== undefined) {
        const cached = this.zombieById.get(t.targetId);
        if (
          cached &&
          !cached.dead &&
          Math.hypot(cached.x - t.x, cached.z - t.z) <= range
        ) {
          best = cached;
        }
      }
      if (!best) {
        best = selectTowerTarget(s.zombies, t, range, t.targetMode, this.map);
        t.targetId = best?.id;
        t.targetRefreshTimer = 0.08;
      }
      if (best) {
        t.aim = Math.atan2(best.x - t.x, best.z - t.z);
        if (cooldown.ready) {
          const combat = applyRunModifiersToCombat(towerCombatStats(t), runEffects);
          const surgeRate = (t.surge ?? 0) > 0 ? Math.max(1, combat.killRush) : 1;
          const rate = towerRate(t) * runEffects.rateMultiplier * surgeRate;
          t.cooldown = 1 / rate;
          t.recoil = 1;
          const crit = this.random() < combat.crit;
          const volley = Math.max(1, Math.min(3, combat.volley));
          const volleyDamageFactor = volley === 3 ? 0.48 : volley === 2 ? 0.68 : 1;
          for (let shot = 0; shot < volley && s.bullets.length < MAX_ACTIVE_BULLETS; shot++) {
            s.bullets.push(
              createTowerProjectile({
                id: this.nextId++,
                // fan multi-shot volleys sideways so a barrage reads as parallel rounds
                x: t.x + Math.cos(t.aim) * (shot - (volley - 1) / 2) * 0.32,
                z: t.z - Math.sin(t.aim) * (shot - (volley - 1) / 2) * 0.32,
                tx: best.x,
                tz: best.z,
                originX: t.x,
                originZ: t.z,
                speed: BULLET_SPEED[t.kind],
                damage: combat.damage * volleyDamageFactor * (crit ? 2.5 : 1),
                target: best.id,
                kind: t.kind,
                splash: combat.splash,
                chain: combat.chain,
                slow: combat.slow,
                burn: combat.burn,
                gold: combat.gold,
                crit,
                level: t.level,
                stun: combat.stun,
                markDuration: combat.markDuration,
                markBonus: combat.markBonus,
                shatterMultiplier: combat.shatterMultiplier,
                executeThreshold: combat.executeThreshold,
                executeMultiplier: combat.executeMultiplier,
                bossDamageMultiplier: combat.bossDamageMultiplier,
                closeDamageMultiplier: combat.closeDamageMultiplier,
                burnDuration: combat.burnDuration,
                markedDamageMultiplier: runEffects.markedDamageMultiplier,
                slowedDamageMultiplier: runEffects.slowedDamageMultiplier,
                stunnedMultiplier: combat.stunnedMultiplier,
                burningMultiplier: combat.burningMultiplier,
                swarmMultiplier: combat.swarmMultiplier,
                burnSpread: combat.burnSpread,
                chainEscalation: combat.chainEscalation,
                eliteDamageMultiplier: combat.eliteDamageMultiplier,
                precisionMultiplier: combat.precisionMultiplier,
                fastDamageMultiplier: combat.fastDamageMultiplier,
                killRush: combat.killRush,
              }),
            );
            this.projectileEmissions += 1;
          }
          sfx(SHOOT_SFX[t.kind]);
        }
      }
    }

    // bullets
    for (const b of s.bullets) {
      const target = b.alive
        ? this.zombieById.get(b.target) ?? null
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
          const statusDamageMultiplier = getRunModifierDamageMultiplier(
            b,
            (z.markTime ?? 0) > 0,
            z.slow > 0,
          );
          const status = applyProjectileStatusEffects(
            z,
            b.slow,
            b.burn,
            b.burnDuration,
          );
          z.slow = z.kind === 5 ? status.slow * 0.45 : status.slow;
          z.burn = status.burn;
          z.burnTime = status.burnTime;
          if (z.burn > 0 && b.burnSpread) z.burnSpread = Math.max(z.burnSpread ?? 0, b.burnSpread);
          const counterplayMultiplier = towerEnemyDamageMultiplier(b.kind, z.kind);
          this.damage(
            z,
            dmg * counterplayMultiplier * statusDamageMultiplier,
            b.x,
            b.z,
            goreBase,
            b.gold,
            z.id === target.id ? b.crit : false,
            {
              stun: b.stun,
              markDuration: b.markDuration,
              markBonus: b.markBonus,
              shatterMultiplier: b.shatterMultiplier,
              executeThreshold: b.executeThreshold,
              executeMultiplier: b.executeMultiplier,
              bossDamageMultiplier: b.bossDamageMultiplier,
              closeDamageMultiplier: b.closeDamageMultiplier,
              stunnedMultiplier: b.stunnedMultiplier,
              burningMultiplier: b.burningMultiplier,
              ...(b.eliteDamageMultiplier !== undefined && { eliteDamageMultiplier: b.eliteDamageMultiplier }),
              ...(b.precisionMultiplier !== undefined && { precisionMultiplier: b.precisionMultiplier }),
              ...(b.fastDamageMultiplier !== undefined && { fastDamageMultiplier: b.fastDamageMultiplier }),
              ...(b.killRush !== undefined && { killRush: b.killRush }),
              damageKind: b.kind,
              originX: b.originX,
              originZ: b.originZ,
            },
          );
        };

        hit(target, b.damage);

        const splashTargets = getSplashTargets(
          s.zombies,
          target.id,
          target.x,
          target.z,
          b.splash,
          this.splashTargets,
        );
        for (const z of splashTargets) {
          hit(
            z,
            b.damage *
              PROJECTILE_SPLASH_DAMAGE_MULTIPLIER *
              (splashTargets.length >= 2 ? b.swarmMultiplier ?? 1 : 1),
          );
        }

        const chainTargets = getChainTargets(
          s.zombies,
          target.id,
          target.x,
          target.z,
          b.chain,
          3.4,
          this.chainTargets,
        );
        for (let jump = 0; jump < chainTargets.length; jump++) {
          hit(
            chainTargets[jump]!,
            b.damage * chainJumpMultiplier(jump, b.chainEscalation ?? 0),
          );
        }
      }
    }

    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2);

    // cleanup: compact arrays in place to avoid per-step temporary allocations.
    if (s.zombies.length > 0) {
      let write = 0;
      for (let read = 0; read < s.zombies.length; read++) {
        const zombie = s.zombies[read]!;
        if (shouldDespawnEnemy(zombie.dead, zombie.fade)) continue;
        s.zombies[write++] = zombie;
      }
      s.zombies.length = write;
    }
    if (s.bullets.length > 0) {
      let write = 0;
      for (let read = 0; read < s.bullets.length; read++) {
        const bullet = s.bullets[read]!;
        if (!bullet.alive) continue;
        s.bullets[write++] = bullet;
      }
      s.bullets.length = write;
    }
    if (s.gibs.length > 0) {
      let write = 0;
      for (let read = 0; read < s.gibs.length; read++) {
        const gib = s.gibs[read]!;
        if (gib.life >= 1.75) continue;
        s.gibs[write++] = gib;
      }
      s.gibs.length = write;
    }
  }
}

export const game = new Game();
