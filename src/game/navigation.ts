export type PrimaryScreen =
  | "main-menu"
  | "stage-select"
  | "gameplay"
  | "results"
  | "towers"
  | "missions"
  | "achievements"
  | "shop"
  | "settings";

export type RunMode = "stage" | "endless";

export type StageDifficulty = "Easy" | "Normal" | "Hard";

export type StageUnlockRequirement = { type: "none" } | { type: "complete-stage"; stageId: number };

export type StageEnemyKind = 0 | 1 | 2;

export type StageEnemyPool = {
  normalKinds: StageEnemyKind[];
  weights?: {
    walker?: number;
    runner?: number;
    brute?: number;
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
      id: "complete-stage";
      label: string;
      type: "complete-stage";
    }
  | {
      id: "base-health-50";
      label: string;
      type: "min-base-health-percent";
      minPercent: number;
    }
  | {
      id: "max-5-towers";
      label: string;
      type: "max-towers-placed";
      maxTowers: number;
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
  mode?: RunMode;
};

export const STAGE_DEFS: StageDefinition[] = [
  {
    id: 1,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 1,
    name: "The Neighborhood",
    description: "Intro defense lane focused on core tower placement fundamentals.",
    difficulty: "Easy",
    unlockRequirement: { type: "none" },
    startingCoins: 180,
    startingBaseHealth: 20,
    waveCount: 6,
    enemyPool: { normalKinds: [0, 1], weights: { walker: 0.8, runner: 0.2 } },
    gameplay: {
      waveDifficultyMultiplier: 0.95,
      waveSizeMultiplier: 0.9,
      spawnIntervalMultiplier: 1.08,
      waveDelayMultiplier: 1.05,
      enemySpeedMultiplier: 0.95,
      enemyHealthMultiplier: 0.95,
    },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1,
    specialRules: ["Intro pacing: calmer opening pressure to teach core towers"],
    rewards: {
      completionCoins: 80,
      completionXp: 120,
      completionStars: 0,
      firstCompletionBonus: { coins: 60, xp: 80, stars: 1 },
    },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      {
        id: "base-health-50",
        label: "Finish with at least 50% base health",
        type: "min-base-health-percent",
        minPercent: 50,
      },
      {
        id: "max-5-towers",
        label: "Complete with no more than 5 towers placed",
        type: "max-towers-placed",
        maxTowers: 5,
      },
    ],
    placeholder: false,
  },
  {
    id: 2,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 2,
    name: "Gas Station",
    description: "Runner-heavy waves hit the fuel depot at a quicker pace.",
    difficulty: "Normal",
    unlockRequirement: { type: "complete-stage", stageId: 1 },
    startingCoins: 190,
    startingBaseHealth: 20,
    waveCount: 7,
    enemyPool: { normalKinds: [0, 1], weights: { walker: 0.45, runner: 0.55 } },
    gameplay: {
      waveDifficultyMultiplier: 1.05,
      waveSizeMultiplier: 1.05,
      spawnIntervalMultiplier: 0.95,
      waveDelayMultiplier: 0.95,
      enemySpeedMultiplier: 1.08,
      enemyHealthMultiplier: 1,
    },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.08,
    specialRules: ["Runner surge: runner-heavy groups with quicker wave cadence"],
    rewards: {
      completionCoins: 95,
      completionXp: 140,
      completionStars: 0,
      firstCompletionBonus: { coins: 70, xp: 95, stars: 1 },
    },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      {
        id: "base-health-50",
        label: "Finish with at least 50% base health",
        type: "min-base-health-percent",
        minPercent: 50,
      },
      {
        id: "max-5-towers",
        label: "Complete with no more than 5 towers placed",
        type: "max-towers-placed",
        maxTowers: 5,
      },
    ],
    placeholder: false,
  },
  {
    id: 3,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 3,
    name: "Shopping Center",
    description: "Mixed enemy formations pressure both parking lanes and storefronts.",
    difficulty: "Normal",
    unlockRequirement: { type: "complete-stage", stageId: 2 },
    startingCoins: 200,
    startingBaseHealth: 19,
    waveCount: 8,
    enemyPool: { normalKinds: [0, 1, 2], weights: { walker: 0.35, runner: 0.4, brute: 0.25 } },
    gameplay: {
      waveDifficultyMultiplier: 1.12,
      waveSizeMultiplier: 1.15,
      spawnIntervalMultiplier: 0.9,
      waveDelayMultiplier: 0.92,
      enemySpeedMultiplier: 1.1,
      enemyHealthMultiplier: 1.05,
    },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: 1.15,
    specialRules: ["Mixed packs: synchronized runner and brute pressure lanes"],
    rewards: {
      completionCoins: 115,
      completionXp: 165,
      completionStars: 0,
      firstCompletionBonus: { coins: 85, xp: 115, stars: 1 },
    },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      {
        id: "base-health-50",
        label: "Finish with at least 50% base health",
        type: "min-base-health-percent",
        minPercent: 50,
      },
      {
        id: "max-5-towers",
        label: "Complete with no more than 5 towers placed",
        type: "max-towers-placed",
        maxTowers: 5,
      },
    ],
    placeholder: false,
  },
  {
    id: 4,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 4,
    name: "Police Station",
    description: "Armored enemies become common while mid-stage pressure ramps up.",
    difficulty: "Hard",
    unlockRequirement: { type: "complete-stage", stageId: 3 },
    startingCoins: 210,
    startingBaseHealth: 18,
    waveCount: 9,
    enemyPool: { normalKinds: [0, 1, 2], weights: { walker: 0.2, runner: 0.35, brute: 0.45 } },
    gameplay: {
      waveDifficultyMultiplier: 1.22,
      waveSizeMultiplier: 1.25,
      spawnIntervalMultiplier: 0.86,
      waveDelayMultiplier: 0.9,
      enemySpeedMultiplier: 1.12,
      enemyHealthMultiplier: 1.08,
    },
    boss: { enabled: true, wave: 9, kind: 2, count: 1 },
    rewardMultiplier: 1.25,
    specialRules: ["Armored patrols: brute frequency rises through mid-stage waves"],
    rewards: {
      completionCoins: 140,
      completionXp: 200,
      completionStars: 0,
      firstCompletionBonus: { coins: 100, xp: 140, stars: 1 },
    },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      {
        id: "base-health-50",
        label: "Finish with at least 50% base health",
        type: "min-base-health-percent",
        minPercent: 50,
      },
      {
        id: "max-5-towers",
        label: "Complete with no more than 5 towers placed",
        type: "max-towers-placed",
        maxTowers: 5,
      },
    ],
    placeholder: false,
  },
  {
    id: 5,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 5,
    name: "Highway",
    description: "Sustain advanced enemy combinations before a major brute boss push.",
    difficulty: "Hard",
    unlockRequirement: { type: "complete-stage", stageId: 4 },
    startingCoins: 220,
    startingBaseHealth: 18,
    waveCount: 10,
    enemyPool: { normalKinds: [0, 1, 2], weights: { walker: 0.15, runner: 0.45, brute: 0.4 } },
    gameplay: {
      waveDifficultyMultiplier: 1.35,
      waveSizeMultiplier: 1.45,
      spawnIntervalMultiplier: 0.78,
      waveDelayMultiplier: 0.85,
      enemySpeedMultiplier: 1.18,
      enemyHealthMultiplier: 1.12,
    },
    boss: { enabled: true, wave: 10, kind: 2, count: 3 },
    rewardMultiplier: 1.4,
    specialRules: ["Final push: sustained mixed swarms before a major brute boss wave"],
    rewards: {
      completionCoins: 170,
      completionXp: 240,
      completionStars: 1,
      firstCompletionBonus: { coins: 130, xp: 180, stars: 1 },
    },
    objectives: [
      { id: "complete-stage", label: "Complete the stage", type: "complete-stage" },
      {
        id: "base-health-50",
        label: "Finish with at least 50% base health",
        type: "min-base-health-percent",
        minPercent: 50,
      },
      {
        id: "max-5-towers",
        label: "Complete with no more than 5 towers placed",
        type: "max-towers-placed",
        maxTowers: 5,
      },
    ],
    placeholder: false,
  },
];

export const ENDLESS_STAGE: StageDefinition = {
  id: 999,
  worldId: 0,
  worldName: "Endless",
  stageNumber: 0,
  name: "Endless Mode",
  description: "Survive as long as you can against escalating zombie waves.",
  difficulty: "Hard",
  unlockRequirement: { type: "none" },
  startingCoins: 205,
  startingBaseHealth: 20,
  waveCount: Number.MAX_SAFE_INTEGER,
  enemyPool: { normalKinds: [0, 1, 2], weights: { walker: 0.55, runner: 0.3, brute: 0.15 } },
  gameplay: {
    waveDifficultyMultiplier: 1.08,
    waveSizeMultiplier: 1.18,
    spawnIntervalMultiplier: 0.92,
    waveDelayMultiplier: 0.86,
    enemySpeedMultiplier: 1.06,
    enemyHealthMultiplier: 1.04,
  },
  boss: { enabled: true, wave: null, kind: 2, count: 1 },
  rewardMultiplier: 1,
  specialRules: [
    "No final wave: pressure continuously rises the longer you survive",
    "Bosses recur at shrinking intervals with increasing counts",
  ],
  rewards: {
    completionCoins: 0,
    completionXp: 0,
    completionStars: 0,
    firstCompletionBonus: { coins: 0, xp: 0, stars: 0 },
  },
  objectives: [],
  placeholder: false,
  mode: "endless",
};

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
    }
  });
  const stars = results.filter((result) => result.passed).length;
  return { results, stars };
}
