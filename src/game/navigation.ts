import type { StageMapId } from "./maps";

export type PrimaryScreen =
  | "main-menu"
  | "stage-select"
  | "endless-select"
  | "boss-trial-select"
  | "gameplay"
  | "results"
  | "towers"
  | "knowledge"
  | "collection"
  | "events"
  | "missions"
  | "achievements"
  | "shop"
  | "settings";

export type StageDifficulty = "Easy" | "Normal" | "Hard";

export type StageUnlockRequirement = { type: "none" } | { type: "complete-stage"; stageId: number };

export type StageEnemyKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StageEnemyPool = {
  normalKinds: StageEnemyKind[];
  weights?: {
    walker?: number;
    runner?: number;
    brute?: number;
    splitter?: number;
    bomber?: number;
    guardian?: number;
    healer?: number;
    swarm?: number;
  };
};

export type StageBossConfig = {
  enabled: boolean;
  wave: number | null;
  kind: StageEnemyKind | null;
  count: number;
};

export type StageRewards = {
  completionCoins: number;
  completionXp: number;
  completionStars: number;
  firstCompletionBonus: {
    coins: number;
    xp: number;
    stars: number;
  };
};

export type StageGameplayConfig = {
  waveDifficultyMultiplier: number;
  waveSizeMultiplier: number;
  spawnIntervalMultiplier: number;
  waveDelayMultiplier: number;
  enemySpeedMultiplier: number;
  enemyHealthMultiplier: number;
};

export type StageObjectiveDefinition =
  | {
      id: string;
      label: string;
      type: "complete-stage";
    }
  | {
      id: string;
      label: string;
      type: "min-base-health-percent";
      minPercent: number;
    }
  | {
      id: string;
      label: string;
      type: "max-towers-placed";
      maxTowers: number;
    }
  | {
      id: string;
      label: string;
      type: "min-kill-streak";
      minStreak: number;
    }
  | {
      id: string;
      label: string;
      type: "min-tower-kinds";
      minKinds: number;
    };

export type StageDefinition = {
  id: number;
  worldId: number;
  worldName: string;
  stageNumber: number;
  name: string;
  description: string;
  difficulty: StageDifficulty;
  unlockRequirement: StageUnlockRequirement;
  startingCoins: number;
  startingBaseHealth: number;
  waveCount: number;
  enemyPool: StageEnemyPool;
  gameplay: StageGameplayConfig;
  boss: StageBossConfig;
  rewardMultiplier: number;
  specialRules: string[];
  rewards: StageRewards;
  objectives: StageObjectiveDefinition[];
  placeholder: boolean;
  mapId: StageMapId;
};

export const STAGE_DEFS: StageDefinition[] = [
  {
    id: 1, worldId: 1, worldName: "Outbreak County", stageNumber: 1,
    name: "Cloverwood Outskirts",
    description: "A gentle suburban S-route introduces clear outer pads, readable bends, and a final corner kill zone.",
    difficulty: "Easy", unlockRequirement: { type: "none" }, startingCoins: 200, startingBaseHealth: 20, waveCount: 16,
    enemyPool: { normalKinds: [0, 1], weights: { walker: 0.8, runner: 0.2 } },
    gameplay: { waveDifficultyMultiplier: 0.88, waveSizeMultiplier: 0.9, spawnIntervalMultiplier: 1.12, waveDelayMultiplier: 1.2, enemySpeedMultiplier: 0.92, enemyHealthMultiplier: 0.92 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1,
    specialRules: ["Intro pacing: calmer opening pressure to teach core towers"],
    rewards: { completionCoins: 80, completionXp: 120, completionStars: 0, firstCompletionBonus: { coins: 60, xp: 80, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
      { id: "max-5-towers", label: "Complete with no more than 5 towers placed", type: "max-towers-placed", maxTowers: 5 },
    ],
    placeholder: false, mapId: "neighborhood",

  },
  {
    id: 2, worldId: 1, worldName: "Outbreak County", stageNumber: 2,
    name: "Amber Orchard",
    description: "Orchard rows frame a long lane and a tight return, teaching the value of range followed by a close-range cleanup post.",
    difficulty: "Easy", unlockRequirement: { type: "complete-stage", stageId: 1 }, startingCoins: 185, startingBaseHealth: 20, waveCount: 7,
    enemyPool: { normalKinds: [0, 1], weights: { walker: 0.55, runner: 0.45 } },
    gameplay: { waveDifficultyMultiplier: 1, waveSizeMultiplier: 0.98, spawnIntervalMultiplier: 1, waveDelayMultiplier: 0.98, enemySpeedMultiplier: 1.02, enemyHealthMultiplier: 1 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.05, specialRules: ["Runner pressure: earlier speed checks reward a balanced first setup"],
    rewards: { completionCoins: 90, completionXp: 135, completionStars: 0, firstCompletionBonus: { coins: 65, xp: 95, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-60", label: "Finish with at least 60% base health", type: "min-base-health-percent", minPercent: 60 },
      { id: "kill-streak-5", label: "Finish with at least a 5-kill streak", type: "min-kill-streak", minStreak: 5 },
    ],
    placeholder: false, mapId: "orchard",
  },
  {
    id: 3, worldId: 1, worldName: "Outbreak County", stageNumber: 3,
    name: "Old Town Market",
    description: "Crowded stalls shape a repeated S-route with several splash pockets and one clean edge sightline.",
    difficulty: "Normal", unlockRequirement: { type: "complete-stage", stageId: 2 }, startingCoins: 195, startingBaseHealth: 19, waveCount: 8,
    enemyPool: { normalKinds: [0, 1, 2, 7], weights: { walker: 0.32, runner: 0.34, brute: 0.18, swarm: 0.16 } },
    gameplay: { waveDifficultyMultiplier: 1.08, waveSizeMultiplier: 1.08, spawnIntervalMultiplier: 0.94, waveDelayMultiplier: 0.94, enemySpeedMultiplier: 1.05, enemyHealthMultiplier: 1.04 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.12, specialRules: ["Mixed packs: runners, brutes, and swarms begin testing coverage diversity"],
    rewards: { completionCoins: 105, completionXp: 155, completionStars: 0, firstCompletionBonus: { coins: 76, xp: 109, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-4", label: "Finish with at least 4 tower types built", type: "min-tower-kinds", minKinds: 4 },
      { id: "max-6-towers", label: "Complete with no more than 6 towers placed", type: "max-towers-placed", maxTowers: 6 },
    ],
    placeholder: false, mapId: "market",
  },
  {
    id: 4, worldId: 1, worldName: "Outbreak County", stageNumber: 4,
    name: "Copper Rail Yard",
    description: "Freight lanes create a central crossfire and a long upper approach where careful placement matters more than raw tower count.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 3 }, startingCoins: 240, startingBaseHealth: 20, waveCount: 28,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 5, 6], weights: { walker: 0.12, runner: 0.22, brute: 0.28, splitter: 0.12, bomber: 0.08, guardian: 0.1, healer: 0.08 } },
    gameplay: { waveDifficultyMultiplier: 1.1, waveSizeMultiplier: 1.16, spawnIntervalMultiplier: 0.9, waveDelayMultiplier: 0.94, enemySpeedMultiplier: 1.1, enemyHealthMultiplier: 1.06 },
    boss: { enabled: true, wave: 28, kind: 2, count: 1 },
    rewardMultiplier: 1.25,
    specialRules: ["Armored patrols: brute frequency rises through mid-stage waves", "Special threats arrive gradually before the final Brute"],
    rewards: { completionCoins: 140, completionXp: 200, completionStars: 0, firstCompletionBonus: { coins: 100, xp: 140, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
      { id: "kill-streak-10", label: "Finish with at least a 10-kill streak", type: "min-kill-streak", minStreak: 10 },
    ],
    placeholder: false, mapId: "rail-yard",

  },
  {
    id: 5, worldId: 1, worldName: "Outbreak County", stageNumber: 5,
    name: "Willow River Checkpoint",
    description: "Water-side clearings create long sightlines while the last bridge approach compresses the route into a decisive finishing zone.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 4 }, startingCoins: 250, startingBaseHealth: 20, waveCount: 32,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 5, 6, 7], weights: { walker: 0.1, runner: 0.2, brute: 0.2, splitter: 0.1, bomber: 0.1, guardian: 0.1, healer: 0.08, swarm: 0.12 } },
    gameplay: { waveDifficultyMultiplier: 1.18, waveSizeMultiplier: 1.28, spawnIntervalMultiplier: 0.84, waveDelayMultiplier: 0.9, enemySpeedMultiplier: 1.12, enemyHealthMultiplier: 1.1 },
    boss: { enabled: true, wave: 32, kind: 2, count: 3 },
    rewardMultiplier: 1.4,
    specialRules: ["Final push: sustained mixed swarms before a major Brute boss wave", "Every special enemy type can appear before the bosses"],
    rewards: { completionCoins: 170, completionXp: 240, completionStars: 1, firstCompletionBonus: { coins: 130, xp: 180, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-5", label: "Finish with at least 5 tower types built", type: "min-tower-kinds", minKinds: 5 },
      { id: "max-7-towers", label: "Complete with no more than 7 towers placed", type: "max-towers-placed", maxTowers: 7 },
    ],
    placeholder: false, mapId: "river-checkpoint",

  },
  {
    id: 6, worldId: 2, worldName: "Wild Frontier", stageNumber: 1,
    name: "Verdant Ruins",
    description: "Ancient stonework and broad jungle clearings surround a path that doubles back around a ruined gate.",
    difficulty: "Normal", unlockRequirement: { type: "complete-stage", stageId: 5 }, startingCoins: 220, startingBaseHealth: 19, waveCount: 9,
    enemyPool: { normalKinds: [0, 1, 2, 7], weights: { walker: 0.25, runner: 0.23, brute: 0.22, swarm: 0.3 } },
    gameplay: { waveDifficultyMultiplier: 1.18, waveSizeMultiplier: 1.2, spawnIntervalMultiplier: 0.9, waveDelayMultiplier: 0.92, enemySpeedMultiplier: 1.08, enemyHealthMultiplier: 1.06 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.3, specialRules: ["Swarm clearings: splash coverage gains value in the open ruin courts"],
    rewards: { completionCoins: 150, completionXp: 220, completionStars: 0, firstCompletionBonus: { coins: 108, xp: 154, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-4", label: "Finish with at least 4 tower types built", type: "min-tower-kinds", minKinds: 4 },
      { id: "max-7-towers", label: "Complete with no more than 7 towers placed", type: "max-towers-placed", maxTowers: 7 },
    ],
    placeholder: false, mapId: "jungle-ruins",
  },
  {
    id: 7, worldId: 2, worldName: "Wild Frontier", stageNumber: 2,
    name: "Mirewater Mangrove",
    description: "Narrow dry islands between swamp channels push the player toward a few high-value placements and a late splash pocket.",
    difficulty: "Normal", unlockRequirement: { type: "complete-stage", stageId: 6 }, startingCoins: 225, startingBaseHealth: 19, waveCount: 10,
    enemyPool: { normalKinds: [0, 1, 5, 7], weights: { walker: 0.23, runner: 0.2, guardian: 0.18, swarm: 0.39 } },
    gameplay: { waveDifficultyMultiplier: 1.24, waveSizeMultiplier: 1.3, spawnIntervalMultiplier: 0.86, waveDelayMultiplier: 0.9, enemySpeedMultiplier: 1.1, enemyHealthMultiplier: 1.08 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.35, specialRules: ["Compressed build zones: fewer legal pads make coverage geometry the puzzle"],
    rewards: { completionCoins: 160, completionXp: 235, completionStars: 0, firstCompletionBonus: { coins: 115, xp: 165, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "kill-streak-10", label: "Finish with at least a 10-kill streak", type: "min-kill-streak", minStreak: 10 },
      { id: "max-7-towers", label: "Complete with no more than 7 towers placed", type: "max-towers-placed", maxTowers: 7 },
    ],
    placeholder: false, mapId: "mangrove",
  },
  {
    id: 8, worldId: 2, worldName: "Wild Frontier", stageNumber: 3,
    name: "Ironwood Pass",
    description: "Towering pines frame alternating long corridors and compact bends, rewarding a layered defense rather than one cluster.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 7 }, startingCoins: 230, startingBaseHealth: 18, waveCount: 10,
    enemyPool: { normalKinds: [0, 1, 2, 5, 6], weights: { walker: 0.18, runner: 0.2, brute: 0.2, guardian: 0.19, healer: 0.1, splitter: 0.13 } },
    gameplay: { waveDifficultyMultiplier: 1.28, waveSizeMultiplier: 1.34, spawnIntervalMultiplier: 0.84, waveDelayMultiplier: 0.88, enemySpeedMultiplier: 1.14, enemyHealthMultiplier: 1.1 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.4, specialRules: ["Guarded corridors: durable enemies make long sightlines especially valuable"],
    rewards: { completionCoins: 175, completionXp: 250, completionStars: 0, firstCompletionBonus: { coins: 126, xp: 175, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-5", label: "Finish with at least 5 tower types built", type: "min-tower-kinds", minKinds: 5 },
      { id: "base-health-55", label: "Finish with at least 55% base health", type: "min-base-health-percent", minPercent: 55 },
    ],
    placeholder: false, mapId: "redwood",
  },
  {
    id: 9, worldId: 2, worldName: "Wild Frontier", stageNumber: 4,
    name: "Whiteglass Research Station",
    description: "A clean frozen complex exaggerates range differences while support enemies punish defenses built around a single firing lane.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 8 }, startingCoins: 235, startingBaseHealth: 18, waveCount: 11,
    enemyPool: { normalKinds: [0, 1, 3, 4, 6], weights: { walker: 0.18, runner: 0.22, splitter: 0.18, bomber: 0.17, healer: 0.25 } },
    gameplay: { waveDifficultyMultiplier: 1.3, waveSizeMultiplier: 1.38, spawnIntervalMultiplier: 0.82, waveDelayMultiplier: 0.86, enemySpeedMultiplier: 1.16, enemyHealthMultiplier: 1.12 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.45, specialRules: ["Support pressure: healer and bomber groups reward focus-fire and coverage overlap"],
    rewards: { completionCoins: 190, completionXp: 270, completionStars: 0, firstCompletionBonus: { coins: 137, xp: 189, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "kill-streak-10", label: "Finish with at least a 10-kill streak", type: "min-kill-streak", minStreak: 10 },
      { id: "max-8-towers", label: "Complete with no more than 8 towers placed", type: "max-towers-placed", maxTowers: 8 },
    ],
    placeholder: false, mapId: "frozen-lab",
  },
  {
    id: 10, worldId: 2, worldName: "Wild Frontier", stageNumber: 5,
    name: "Blueglass Cavern",
    description: "Ice shelves make the route feel carved through chambers, with sharp turns that reward keeping a close-range reserve near the end.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 9 }, startingCoins: 240, startingBaseHealth: 18, waveCount: 11,
    enemyPool: { normalKinds: [0, 2, 5, 6], weights: { walker: 0.16, brute: 0.28, guardian: 0.22, healer: 0.16, runner: 0.18 } },
    gameplay: { waveDifficultyMultiplier: 1.35, waveSizeMultiplier: 1.42, spawnIntervalMultiplier: 0.8, waveDelayMultiplier: 0.84, enemySpeedMultiplier: 1.17, enemyHealthMultiplier: 1.13 },
    boss: { enabled: true, wave: 11, kind: 2, count: 1 },
    rewardMultiplier: 1.5, specialRules: ["Cavern boss gate: a late Brute/guardian push tests both sustained and burst damage"],
    rewards: { completionCoins: 210, completionXp: 300, completionStars: 1, firstCompletionBonus: { coins: 151, xp: 210, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
      { id: "tower-kinds-5", label: "Finish with at least 5 tower types built", type: "min-tower-kinds", minKinds: 5 },
    ],
    placeholder: false, mapId: "ice-cavern",
  },
  {
    id: 11, worldId: 3, worldName: "Broken Supply Route", stageNumber: 1,
    name: "Stormbreak Harbor",
    description: "Cargo lanes beside the water create long straight shots interrupted by deliberate inner bends near the base.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 10 }, startingCoins: 240, startingBaseHealth: 18, waveCount: 11,
    enemyPool: { normalKinds: [0, 1, 2, 4, 7], weights: { walker: 0.15, runner: 0.2, brute: 0.2, bomber: 0.18, swarm: 0.27 } },
    gameplay: { waveDifficultyMultiplier: 1.34, waveSizeMultiplier: 1.42, spawnIntervalMultiplier: 0.82, waveDelayMultiplier: 0.86, enemySpeedMultiplier: 1.15, enemyHealthMultiplier: 1.12 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.52, specialRules: ["Dockside exposure: sustained lanes reward precision while swarms punish greedy single-target setups"],
    rewards: { completionCoins: 225, completionXp: 320, completionStars: 0, firstCompletionBonus: { coins: 162, xp: 224, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "max-8-towers", label: "Complete with no more than 8 towers placed", type: "max-towers-placed", maxTowers: 8 },
      { id: "base-health-55", label: "Finish with at least 55% base health", type: "min-base-health-percent", minPercent: 55 },
    ],
    placeholder: false, mapId: "harbor",
  },
  {
    id: 12, worldId: 3, worldName: "Broken Supply Route", stageNumber: 2,
    name: "Sunscar Bazaar",
    description: "Open desert sightlines surround a zigzagging bazaar lane, making central coverage valuable and edge placements more specialized.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 11 }, startingCoins: 245, startingBaseHealth: 18, waveCount: 12,
    enemyPool: { normalKinds: [0, 1, 2, 3, 7], weights: { walker: 0.14, runner: 0.2, brute: 0.2, splitter: 0.17, swarm: 0.29 } },
    gameplay: { waveDifficultyMultiplier: 1.38, waveSizeMultiplier: 1.46, spawnIntervalMultiplier: 0.8, waveDelayMultiplier: 0.84, enemySpeedMultiplier: 1.17, enemyHealthMultiplier: 1.13 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.55, specialRules: ["Open-field puzzle: long shots are plentiful, but each corner needs a deliberate answer"],
    rewards: { completionCoins: 240, completionXp: 340, completionStars: 0, firstCompletionBonus: { coins: 173, xp: 238, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "kill-streak-12", label: "Finish with at least a 12-kill streak", type: "min-kill-streak", minStreak: 12 },
      { id: "tower-kinds-5", label: "Finish with at least 5 tower types built", type: "min-tower-kinds", minKinds: 5 },
    ],
    placeholder: false, mapId: "desert-bazaar",
  },
  {
    id: 13, worldId: 3, worldName: "Broken Supply Route", stageNumber: 3,
    name: "Redrock Narrows",
    description: "The narrowest route so far snakes between stone shelves, maximizing exposure but sharply reducing comfortable tower space.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 12 }, startingCoins: 250, startingBaseHealth: 17, waveCount: 12,
    enemyPool: { normalKinds: [0, 1, 2, 5, 7], weights: { walker: 0.14, runner: 0.18, brute: 0.24, guardian: 0.18, swarm: 0.26 } },
    gameplay: { waveDifficultyMultiplier: 1.42, waveSizeMultiplier: 1.48, spawnIntervalMultiplier: 0.78, waveDelayMultiplier: 0.82, enemySpeedMultiplier: 1.18, enemyHealthMultiplier: 1.15 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.58, specialRules: ["Narrow route: every premium placement covers a lot of path but competes for limited ground"],
    rewards: { completionCoins: 255, completionXp: 360, completionStars: 0, firstCompletionBonus: { coins: 184, xp: 252, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
      { id: "max-8-towers", label: "Complete with no more than 8 towers placed", type: "max-towers-placed", maxTowers: 8 },
    ],
    placeholder: false, mapId: "redrock-canyon",
  },
  {
    id: 14, worldId: 3, worldName: "Broken Supply Route", stageNumber: 4,
    name: "Blackvein Mine",
    description: "Mine chambers alternate cramped turns and open drifts, encouraging a defense that shifts from central coverage to a strong upper finish.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 13 }, startingCoins: 255, startingBaseHealth: 17, waveCount: 12,
    enemyPool: { normalKinds: [0, 2, 3, 4, 6], weights: { walker: 0.12, runner: 0.18, brute: 0.22, splitter: 0.17, bomber: 0.16, healer: 0.15 } },
    gameplay: { waveDifficultyMultiplier: 1.45, waveSizeMultiplier: 1.5, spawnIntervalMultiplier: 0.78, waveDelayMultiplier: 0.8, enemySpeedMultiplier: 1.19, enemyHealthMultiplier: 1.16 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.6, specialRules: ["Chamber rhythm: mixed threat packs punish defenses that cannot retarget across turns"],
    rewards: { completionCoins: 270, completionXp: 380, completionStars: 0, firstCompletionBonus: { coins: 194, xp: 266, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-5", label: "Finish with at least 5 tower types built", type: "min-tower-kinds", minKinds: 5 },
      { id: "kill-streak-12", label: "Finish with at least a 12-kill streak", type: "min-kill-streak", minStreak: 12 },
    ],
    placeholder: false, mapId: "deep-mine",
  },
  {
    id: 15, worldId: 3, worldName: "Broken Supply Route", stageNumber: 5,
    name: "Fort Ember",
    description: "A fortified route alternates broad firing lanes and hard turns, culminating in two boss bruisers that demand a deep layered defense.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 14 }, startingCoins: 265, startingBaseHealth: 17, waveCount: 12,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 5, 6], weights: { walker: 0.1, runner: 0.16, brute: 0.22, splitter: 0.12, bomber: 0.12, guardian: 0.14, healer: 0.14 } },
    gameplay: { waveDifficultyMultiplier: 1.5, waveSizeMultiplier: 1.56, spawnIntervalMultiplier: 0.76, waveDelayMultiplier: 0.8, enemySpeedMultiplier: 1.2, enemyHealthMultiplier: 1.17 },
    boss: { enabled: true, wave: 12, kind: 2, count: 2 },
    rewardMultiplier: 1.62, specialRules: ["Fortress boss gate: durable special waves lead into a two-Brute finish"],
    rewards: { completionCoins: 290, completionXp: 405, completionStars: 1, firstCompletionBonus: { coins: 209, xp: 284, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-55", label: "Finish with at least 55% base health", type: "min-base-health-percent", minPercent: 55 },
      { id: "tower-kinds-6", label: "Finish with at least 6 tower types built", type: "min-tower-kinds", minKinds: 6 },
    ],
    placeholder: false, mapId: "military-outpost",
  },
  {
    id: 16, worldId: 4, worldName: "Dead City", stageNumber: 1,
    name: "Hollowpoint City",
    description: "Abandoned blocks and parked cars frame a long alley-and-avenue route with several crossfire-ready center positions.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 15 }, startingCoins: 270, startingBaseHealth: 17, waveCount: 13,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 6, 7], weights: { walker: 0.1, runner: 0.18, brute: 0.19, splitter: 0.13, bomber: 0.12, guardian: 0.12, healer: 0.1, swarm: 0.06 } },
    gameplay: { waveDifficultyMultiplier: 1.52, waveSizeMultiplier: 1.58, spawnIntervalMultiplier: 0.74, waveDelayMultiplier: 0.78, enemySpeedMultiplier: 1.21, enemyHealthMultiplier: 1.18 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.65, specialRules: ["Urban compression: sightline breaks make overlapping towers more valuable than isolated nests"],
    rewards: { completionCoins: 310, completionXp: 430, completionStars: 0, firstCompletionBonus: { coins: 223, xp: 301, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "max-9-towers", label: "Complete with no more than 9 towers placed", type: "max-towers-placed", maxTowers: 9 },
      { id: "kill-streak-14", label: "Finish with at least a 14-kill streak", type: "min-kill-streak", minStreak: 14 },
    ],
    placeholder: false, mapId: "abandoned-city",
  },
  {
    id: 17, worldId: 4, worldName: "Dead City", stageNumber: 2,
    name: "Ashline Foundry",
    description: "Industrial buildings frame long machine lanes and a punishing return bend where close-range towers can clean up survivors.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 16 }, startingCoins: 275, startingBaseHealth: 17, waveCount: 13,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 6], weights: { walker: 0.09, runner: 0.16, brute: 0.23, splitter: 0.14, bomber: 0.14, guardian: 0.12, healer: 0.12 } },
    gameplay: { waveDifficultyMultiplier: 1.56, waveSizeMultiplier: 1.62, spawnIntervalMultiplier: 0.72, waveDelayMultiplier: 0.76, enemySpeedMultiplier: 1.22, enemyHealthMultiplier: 1.19 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.7, specialRules: ["Foundry pressure: long lanes build damage while special enemies test target priority"],
    rewards: { completionCoins: 325, completionXp: 450, completionStars: 0, firstCompletionBonus: { coins: 234, xp: 315, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-6", label: "Finish with at least 6 tower types built", type: "min-tower-kinds", minKinds: 6 },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
    ],
    placeholder: false, mapId: "foundry",
  },
  {
    id: 18, worldId: 4, worldName: "Dead City", stageNumber: 3,
    name: "Hallowed Grounds",
    description: "Grave markers and a cathedral landmark frame a route with dependable bend kill zones followed by a tight endgame turn.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 17 }, startingCoins: 280, startingBaseHealth: 16, waveCount: 13,
    enemyPool: { normalKinds: [0, 1, 2, 5, 7], weights: { walker: 0.08, runner: 0.15, brute: 0.24, guardian: 0.2, swarm: 0.18, healer: 0.15 } },
    gameplay: { waveDifficultyMultiplier: 1.58, waveSizeMultiplier: 1.66, spawnIntervalMultiplier: 0.72, waveDelayMultiplier: 0.75, enemySpeedMultiplier: 1.23, enemyHealthMultiplier: 1.2 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.74, specialRules: ["Endgame swarm: repeated bends reward splash while guardians hold the line"],
    rewards: { completionCoins: 340, completionXp: 470, completionStars: 0, firstCompletionBonus: { coins: 245, xp: 329, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "kill-streak-14", label: "Finish with at least a 14-kill streak", type: "min-kill-streak", minStreak: 14 },
      { id: "max-9-towers", label: "Complete with no more than 9 towers placed", type: "max-towers-placed", maxTowers: 9 },
    ],
    placeholder: false, mapId: "graveyard",
  },
  {
    id: 19, worldId: 4, worldName: "Dead City", stageNumber: 4,
    name: "Cinderfall Caldera",
    description: "Volcanic rock shelves tighten the route around a brilliant crater landmark, creating strong corners and few wasteful placements.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 18 }, startingCoins: 285, startingBaseHealth: 16, waveCount: 14,
    enemyPool: { normalKinds: [0, 1, 2, 3, 5, 7], weights: { walker: 0.07, runner: 0.15, brute: 0.25, splitter: 0.14, guardian: 0.18, swarm: 0.12, healer: 0.09 } },
    gameplay: { waveDifficultyMultiplier: 1.62, waveSizeMultiplier: 1.7, spawnIntervalMultiplier: 0.7, waveDelayMultiplier: 0.74, enemySpeedMultiplier: 1.24, enemyHealthMultiplier: 1.22 },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.8, specialRules: ["Caldera gauntlet: sustained pressure leaves little time to recover from a weak placement"],
    rewards: { completionCoins: 360, completionXp: 500, completionStars: 0, firstCompletionBonus: { coins: 259, xp: 350, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "base-health-50", label: "Finish with at least 50% base health", type: "min-base-health-percent", minPercent: 50 },
      { id: "tower-kinds-6", label: "Finish with at least 6 tower types built", type: "min-tower-kinds", minKinds: 6 },
    ],
    placeholder: false, mapId: "volcano",
  },
  {
    id: 20, worldId: 4, worldName: "Dead City", stageNumber: 5,
    name: "Blacksite Omega",
    description: "The campaign finale alternates broad containment lanes with hard turns around a reactor core, combining nearly every map lesson into one layered defense.",
    difficulty: "Hard", unlockRequirement: { type: "complete-stage", stageId: 19 }, startingCoins: 295, startingBaseHealth: 16, waveCount: 14,
    enemyPool: { normalKinds: [0, 1, 2, 3, 4, 5, 6, 7], weights: { walker: 0.06, runner: 0.14, brute: 0.2, splitter: 0.12, bomber: 0.12, guardian: 0.14, healer: 0.12, swarm: 0.1 } },
    gameplay: { waveDifficultyMultiplier: 1.68, waveSizeMultiplier: 1.76, spawnIntervalMultiplier: 0.68, waveDelayMultiplier: 0.72, enemySpeedMultiplier: 1.26, enemyHealthMultiplier: 1.24 },
    boss: { enabled: true, wave: 14, kind: 2, count: 3 },
    rewardMultiplier: 1.9, specialRules: ["Finale boss gate: a full mixed-threat gauntlet ends with three Brutes at the reactor"],
    rewards: { completionCoins: 390, completionXp: 540, completionStars: 2, firstCompletionBonus: { coins: 281, xp: 378, stars: 1 } },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      { id: "tower-kinds-7", label: "Finish with at least 7 tower types built", type: "min-tower-kinds", minKinds: 7 },
      { id: "kill-streak-16", label: "Finish with at least a 16-kill streak", type: "min-kill-streak", minStreak: 16 },
    ],
    placeholder: false, mapId: "blacksite",
  },
];

export function getStageById(stageId: number) {
  return STAGE_DEFS.find((stage) => stage.id === stageId) ?? STAGE_DEFS[0]!;
}

export function getNextStageId(stageId: number) {
  const index = STAGE_DEFS.findIndex((stage) => stage.id === stageId);
  if (index < 0 || index + 1 >= STAGE_DEFS.length) return null;
  return STAGE_DEFS[index + 1]!.id;
}

export function stageUnlockRequirementText(requirement: StageUnlockRequirement) {
  if (requirement.type === "none") return "Unlocked";
  return `Complete Stage ${requirement.stageId}`;
}

export type StageObjectiveContext = {
  stageCompleted: boolean;
  baseHealth: number;
  baseMaxHealth: number;
  towersPlaced: number;
  maxKillStreak: number;
  uniqueTowerKinds: number;
};

export type StageObjectiveResult = {
  objective: StageObjectiveDefinition;
  passed: boolean;
};

export function evaluateStageObjectives(
  objectives: StageObjectiveDefinition[],
  context: StageObjectiveContext,
) {
  const results: StageObjectiveResult[] = objectives.map((objective) => {
    switch (objective.type) {
      case "complete-stage":
        return { objective, passed: context.stageCompleted };
      case "min-base-health-percent": {
        const percent =
          context.baseMaxHealth <= 0 ? 0 : (context.baseHealth / context.baseMaxHealth) * 100;
        return { objective, passed: percent >= objective.minPercent };
      }
      case "max-towers-placed":
        return {
          objective,
          passed: context.stageCompleted && context.towersPlaced <= objective.maxTowers,
        };
      case "min-kill-streak":
        return {
          objective,
          passed: context.stageCompleted && context.maxKillStreak >= objective.minStreak,
        };
      case "min-tower-kinds":
        return {
          objective,
          passed: context.stageCompleted && context.uniqueTowerKinds >= objective.minKinds,
        };
    }
  });
  const stars = results.filter((result) => result.passed).length;
  return { results, stars };
}
