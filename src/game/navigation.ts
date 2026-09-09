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

export type StageDifficulty = "Easy" | "Normal" | "Hard";

export type StageUnlockRequirement = { type: "none" } | { type: "complete-stage"; stageId: number };

export type StageEnemyKind = 0 | 1 | 2;

export type StageEnemyPool = {
  normalKinds: StageEnemyKind[];
};

export type StageBossConfig = {
  enabled: boolean;
  wave: number | null;
  kind: StageEnemyKind | null;
  count: number;
};

export type StageRewards = {
  coins: number;
  xp: number;
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
  boss: StageBossConfig;
  rewards: StageRewards;
  objectives: StageObjectiveDefinition[];
  placeholder: boolean;
};

export const STAGE_DEFS: StageDefinition[] = [
  {
    id: 1,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 1,
    name: "The Neighborhood",
    description: "Hold the front streets while survivors evacuate.",
    difficulty: "Easy",
    unlockRequirement: { type: "none" },
    startingCoins: 180,
    startingBaseHealth: 20,
    waveCount: 6,
    enemyPool: { normalKinds: [0, 1] },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewards: { coins: 80, xp: 120 },
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
    description: "Protect the fuel depot from the next wave.",
    difficulty: "Normal",
    unlockRequirement: { type: "complete-stage", stageId: 1 },
    startingCoins: 190,
    startingBaseHealth: 20,
    waveCount: 7,
    enemyPool: { normalKinds: [0, 1] },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewards: { coins: 90, xp: 130 },
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
    placeholder: true,
  },
  {
    id: 3,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 3,
    name: "Shopping Center",
    description: "Secure the parking lanes and hold the storefronts.",
    difficulty: "Normal",
    unlockRequirement: { type: "complete-stage", stageId: 2 },
    startingCoins: 200,
    startingBaseHealth: 19,
    waveCount: 8,
    enemyPool: { normalKinds: [0, 1, 2] },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewards: { coins: 100, xp: 145 },
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
    placeholder: true,
  },
  {
    id: 4,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 4,
    name: "Police Station",
    description: "Defend the barricade while dispatch units regroup.",
    difficulty: "Hard",
    unlockRequirement: { type: "complete-stage", stageId: 3 },
    startingCoins: 210,
    startingBaseHealth: 18,
    waveCount: 9,
    enemyPool: { normalKinds: [0, 1, 2] },
    boss: { enabled: true, wave: 9, kind: 2, count: 1 },
    rewards: { coins: 125, xp: 170 },
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
    placeholder: true,
  },
  {
    id: 5,
    worldId: 1,
    worldName: "Suburbs",
    stageNumber: 5,
    name: "Highway",
    description: "Hold the overpass for the final convoy breakout.",
    difficulty: "Hard",
    unlockRequirement: { type: "complete-stage", stageId: 4 },
    startingCoins: 220,
    startingBaseHealth: 18,
    waveCount: 10,
    enemyPool: { normalKinds: [0, 1, 2] },
    boss: { enabled: true, wave: 10, kind: 2, count: 2 },
    rewards: { coins: 150, xp: 200 },
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
    placeholder: true,
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
