import { getStageById, type StageDefinition, type StageDifficulty } from "./navigation";

export type SideModeCategory = "resource" | "challenge" | "event";
export type SideModeFocus = "scrap" | "xp" | "gems" | "balanced";

export type SideModeLevel = {
  id: string;
  category: SideModeCategory;
  name: string;
  shortName: string;
  description: string;
  purpose: string;
  duration: "2–4 min" | "3–7 min" | "5–8 min";
  unlockStageId: number;
  level: number;
  focus: SideModeFocus;
  sourceStageId: number;
  stage: StageDefinition;
  rewardHint: string;
  masteryHint: string;
  maxTowers?: number;
  allowedTowerKinds?: string[];
  cycle?: "daily" | "weekly" | "event";
};

function buildLevel(
  config: Omit<SideModeLevel, "stage"> & {
    stageOverrides?: Partial<StageDefinition>;
  },
): SideModeLevel {
  const source = getStageById(config.sourceStageId);
  const stage: StageDefinition = {
    ...source,
    id: 2000 + config.level,
    stageNumber: config.level,
    name: config.name,
    description: config.description,
    difficulty: (config.stageOverrides?.difficulty ?? source.difficulty) as StageDifficulty,
    unlockRequirement: { type: "none" },
    ...config.stageOverrides,
    specialRules: [
      config.purpose,
      ...(config.stageOverrides?.specialRules ?? []),
    ],
  };
  return { ...config, stage };
}

export const RESOURCE_OPS: SideModeLevel[] = [
  buildLevel({
    id: "scrap-run-1",
    category: "resource",
    name: "Scrap Run I",
    shortName: "SCRAP I",
    description: "A compact salvage route packed with walkers, runners, and easy scrap targets.",
    purpose: "Focused credits run",
    duration: "3–7 min",
    unlockStageId: 2,
    level: 1,
    focus: "scrap",
    sourceStageId: 3,
    rewardHint: "+180 completion credits",
    masteryHint: "Finish with 60%+ base health",
    stageOverrides: {
      waveCount: 6,
      startingCoins: 180,
      startingBaseHealth: 20,
      rewardMultiplier: 1,
      rewards: { completionCoins: 180, completionXp: 80, completionStars: 0, firstCompletionBonus: { coins: 100, xp: 40, stars: 0 } },
      gameplay: { ...getStageById(3).gameplay, waveDifficultyMultiplier: 0.92, waveSizeMultiplier: 0.95, spawnIntervalMultiplier: 1.02 },
    },
  }),
  buildLevel({
    id: "scrap-run-2",
    category: "resource",
    name: "Scrap Run II",
    shortName: "SCRAP II",
    description: "More special enemies and tighter pressure make this a faster, richer salvage route.",
    purpose: "Higher-yield credits run",
    duration: "3–7 min",
    unlockStageId: 5,
    level: 2,
    focus: "scrap",
    sourceStageId: 7,
    rewardHint: "+280 completion credits",
    masteryHint: "Reach a 10-kill streak",
    stageOverrides: {
      waveCount: 7,
      startingCoins: 210,
      startingBaseHealth: 19,
      rewardMultiplier: 1.08,
      rewards: { completionCoins: 280, completionXp: 110, completionStars: 0, firstCompletionBonus: { coins: 120, xp: 55, stars: 0 } },
      gameplay: { ...getStageById(7).gameplay, waveDifficultyMultiplier: 1.02, waveSizeMultiplier: 1.05, spawnIntervalMultiplier: 0.92 },
    },
  }),
  buildLevel({
    id: "scrap-run-3",
    category: "resource",
    name: "Scrap Run III",
    shortName: "SCRAP III",
    description: "A full salvage push with mixed threats designed for reliable late-game credit income.",
    purpose: "Endgame-focused credits run",
    duration: "5–8 min",
    unlockStageId: 10,
    level: 3,
    focus: "scrap",
    sourceStageId: 15,
    rewardHint: "+420 completion credits",
    masteryHint: "Use 5+ tower types and finish intact",
    stageOverrides: {
      waveCount: 8,
      startingCoins: 245,
      startingBaseHealth: 18,
      rewardMultiplier: 1.15,
      rewards: { completionCoins: 420, completionXp: 160, completionStars: 0, firstCompletionBonus: { coins: 160, xp: 80, stars: 0 } },
      gameplay: { ...getStageById(15).gameplay, waveDifficultyMultiplier: 1.06, waveSizeMultiplier: 1.08, spawnIntervalMultiplier: 0.9 },
    },
  }),
  buildLevel({
    id: "xp-run-1",
    category: "resource",
    name: "XP Run I",
    shortName: "XP I",
    description: "A steady seven-wave survival route tuned for reliable experience gains.",
    purpose: "Focused XP run",
    duration: "3–7 min",
    unlockStageId: 4,
    level: 4,
    focus: "xp",
    sourceStageId: 4,
    rewardHint: "+220 completion XP",
    masteryHint: "Finish with 50%+ base health",
    stageOverrides: {
      waveCount: 7,
      rewardMultiplier: 1,
      rewards: { completionCoins: 110, completionXp: 220, completionStars: 0, firstCompletionBonus: { coins: 45, xp: 100, stars: 0 } },
      gameplay: { ...getStageById(4).gameplay, waveDifficultyMultiplier: 0.98, waveSizeMultiplier: 0.98, spawnIntervalMultiplier: 1 },
    },
  }),
  buildLevel({
    id: "xp-run-2",
    category: "resource",
    name: "XP Run II",
    shortName: "XP II",
    description: "A harder mixed-threat gauntlet with a larger completion payout for leveling momentum.",
    purpose: "Higher-yield XP run",
    duration: "5–8 min",
    unlockStageId: 8,
    level: 5,
    focus: "xp",
    sourceStageId: 10,
    rewardHint: "+360 completion XP",
    masteryHint: "Reach Wave 8 without losing more than 2 base health",
    stageOverrides: {
      waveCount: 8,
      rewardMultiplier: 1.1,
      rewards: { completionCoins: 150, completionXp: 360, completionStars: 0, firstCompletionBonus: { coins: 60, xp: 140, stars: 0 } },
      gameplay: { ...getStageById(10).gameplay, waveDifficultyMultiplier: 1.05, waveSizeMultiplier: 1.02, spawnIntervalMultiplier: 0.9 },
    },
  }),
  buildLevel({
    id: "gem-operation",
    category: "resource",
    name: "Gem Operation",
    shortName: "GEM OPS",
    description: "A compact high-pressure operation with a controlled first-clear gem payout.",
    purpose: "Rare gem milestone",
    duration: "5–8 min",
    unlockStageId: 12,
    level: 6,
    focus: "gems",
    sourceStageId: 15,
    rewardHint: "+3 gems on clear; +2 first clear",
    masteryHint: "Clear with 5+ tower types",
    stageOverrides: {
      waveCount: 7,
      startingCoins: 245,
      startingBaseHealth: 17,
      rewardMultiplier: 1.15,
      rewards: { completionCoins: 180, completionXp: 200, completionStars: 0, firstCompletionBonus: { coins: 80, xp: 80, stars: 0 } },
      gameplay: { ...getStageById(15).gameplay, waveDifficultyMultiplier: 1.14, waveSizeMultiplier: 1.12, spawnIntervalMultiplier: 0.82 },
      boss: { enabled: true, wave: 7, kind: 2, count: 1 },
    },
  }),
  buildLevel({
    id: "supply-depot",
    category: "resource",
    name: "Supply Depot",
    shortName: "DEPOT",
    description: "A compact defense assignment that rewards efficient tower placement with a balanced payout.",
    purpose: "Flexible resource run",
    duration: "3–7 min",
    unlockStageId: 5,
    level: 7,
    focus: "balanced",
    sourceStageId: 11,
    rewardHint: "Credits + XP + first-clear bonus",
    masteryHint: "Clear using 6 towers or fewer",
    maxTowers: 6,
    stageOverrides: {
      waveCount: 6,
      startingCoins: 230,
      startingBaseHealth: 20,
      rewardMultiplier: 1.05,
      rewards: { completionCoins: 220, completionXp: 180, completionStars: 0, firstCompletionBonus: { coins: 90, xp: 70, stars: 0 } },
      gameplay: { ...getStageById(11).gameplay, waveDifficultyMultiplier: 1, waveSizeMultiplier: 0.9, spawnIntervalMultiplier: 0.95 },
    },
  }),
];

export const CHALLENGE_GAUNTLET: SideModeLevel[] = [
  buildLevel({
    id: "one-tower",
    category: "challenge",
    name: "One Tower",
    shortName: "ONE TOWER",
    description: "Defend the route with a single tower. Every placement decision matters.",
    purpose: "Extreme placement efficiency",
    duration: "2–4 min",
    unlockStageId: 3,
    level: 1,
    focus: "balanced",
    sourceStageId: 2,
    rewardHint: "Clear + mastery bonus",
    masteryHint: "Reach 5 kills in a streak",
    maxTowers: 1,
    stageOverrides: {
      waveCount: 5,
      startingCoins: 450,
      rewardMultiplier: 1.15,
      rewards: { completionCoins: 170, completionXp: 120, completionStars: 0, firstCompletionBonus: { coins: 90, xp: 60, stars: 0 } },
      objectives: [
        { id: "complete-stage", label: "Survive the gauntlet", type: "complete-stage" },
        { id: "max-1-tower", label: "Use no more than 1 tower", type: "max-towers-placed", maxTowers: 1 },
      ],
    },
  }),
  buildLevel({
    id: "last-stand",
    category: "challenge",
    name: "Last Stand",
    shortName: "LAST STAND",
    description: "The base starts damaged. There is no room for a weak opening.",
    purpose: "Crisis management",
    duration: "2–4 min",
    unlockStageId: 4,
    level: 2,
    focus: "balanced",
    sourceStageId: 4,
    rewardHint: "Clear + first-clear gems",
    masteryHint: "Finish with the base above 50%",
    stageOverrides: {
      waveCount: 6,
      startingBaseHealth: 7,
      startingCoins: 300,
      rewardMultiplier: 1.2,
      rewards: { completionCoins: 210, completionXp: 145, completionStars: 0, firstCompletionBonus: { coins: 100, xp: 70, stars: 0 } },
      objectives: [
        { id: "complete-stage", label: "Survive the last stand", type: "complete-stage" },
        { id: "base-health-50", label: "Finish above 50% base health", type: "min-base-health-percent", minPercent: 50 },
      ],
    },
  }),
  buildLevel({
    id: "swarm-breaker",
    category: "challenge",
    name: "Swarm Breaker",
    shortName: "SWARM",
    description: "Huge lightweight packs flood a short route. Clear speed matters more than single-target damage.",
    purpose: "Crowd-control mastery",
    duration: "3–7 min",
    unlockStageId: 5,
    level: 3,
    focus: "balanced",
    sourceStageId: 6,
    rewardHint: "Clear + high-kill bonus",
    masteryHint: "Reach a 15-kill streak",
    stageOverrides: {
      waveCount: 6,
      rewardMultiplier: 1.18,
      gameplay: { ...getStageById(6).gameplay, waveSizeMultiplier: 1.5, enemyHealthMultiplier: 0.72, enemySpeedMultiplier: 1.08, spawnIntervalMultiplier: 0.78 },
      enemyPool: { normalKinds: [0, 1, 7], weights: { walker: 0.22, runner: 0.2, swarm: 0.58 } },
    },
  }),
  buildLevel({
    id: "long-shot",
    category: "challenge",
    name: "Long Shot",
    shortName: "LONG SHOT",
    description: "A long-lane defense that gives precision towers room to shine.",
    purpose: "Range and target priority mastery",
    duration: "3–7 min",
    unlockStageId: 6,
    level: 4,
    focus: "balanced",
    sourceStageId: 9,
    rewardHint: "Clear + precision bonus",
    masteryHint: "Use 3 or fewer towers",
    maxTowers: 3,
    allowedTowerKinds: ["rifleman", "sniper", "laser"],
    stageOverrides: {
      waveCount: 7,
      startingCoins: 360,
      rewardMultiplier: 1.22,
      rewards: { completionCoins: 240, completionXp: 165, completionStars: 0, firstCompletionBonus: { coins: 100, xp: 80, stars: 0 } },
    },
  }),
  buildLevel({
    id: "close-quarters",
    category: "challenge",
    name: "Close Quarters",
    shortName: "CLOSE",
    description: "A compressed route where short-range coverage and disciplined spacing matter.",
    purpose: "Positioning under compression",
    duration: "3–7 min",
    unlockStageId: 8,
    level: 5,
    focus: "balanced",
    sourceStageId: 13,
    rewardHint: "Clear + no-waste bonus",
    masteryHint: "Finish with 6 or fewer towers",
    maxTowers: 6,
    stageOverrides: {
      waveCount: 7,
      startingCoins: 320,
      rewardMultiplier: 1.18,
      gameplay: { ...getStageById(13).gameplay, enemySpeedMultiplier: 1.05, enemyHealthMultiplier: 0.96 },
    },
  }),
  buildLevel({
    id: "speed-run",
    category: "challenge",
    name: "Speed Run",
    shortName: "SPEED RUN",
    description: "A five-wave sprint with compressed spawn gaps and rewards for aggressive clears.",
    purpose: "Fast decision-making",
    duration: "2–4 min",
    unlockStageId: 7,
    level: 6,
    focus: "balanced",
    sourceStageId: 12,
    rewardHint: "Clear + speed milestone",
    masteryHint: "Reach a 10-kill streak",
    stageOverrides: {
      waveCount: 5,
      startingCoins: 360,
      rewardMultiplier: 1.25,
      gameplay: { ...getStageById(12).gameplay, waveSizeMultiplier: 1.1, spawnIntervalMultiplier: 0.62, waveDelayMultiplier: 0.7, enemySpeedMultiplier: 1.16, enemyHealthMultiplier: 0.9 },
    },
  }),
  buildLevel({
    id: "fixed-loadout",
    category: "challenge",
    name: "Fixed Loadout",
    shortName: "LOADOUT",
    description: "The game gives you a fixed three-tower toolbox. Win with the hand you are dealt.",
    purpose: "Adaptation and roster mastery",
    duration: "3–7 min",
    unlockStageId: 9,
    level: 7,
    focus: "balanced",
    sourceStageId: 14,
    rewardHint: "Clear + adaptation bonus",
    masteryHint: "Finish with 5+ tower types unavailable; master the three provided",
    allowedTowerKinds: ["shotgunner", "freezer", "tesla"],
    stageOverrides: {
      waveCount: 7,
      startingCoins: 410,
      rewardMultiplier: 1.22,
      gameplay: { ...getStageById(14).gameplay, waveDifficultyMultiplier: 1.02, waveSizeMultiplier: 0.96 },
    },
  }),
  buildLevel({
    id: "boss-hunt",
    category: "challenge",
    name: "Boss Hunt",
    shortName: "BOSS HUNT",
    description: "Build quickly, then face a single Brute before the route overwhelms you.",
    purpose: "Burst-damage mastery",
    duration: "3–7 min",
    unlockStageId: 10,
    level: 8,
    focus: "balanced",
    sourceStageId: 15,
    rewardHint: "Boss clear payout",
    masteryHint: "Defeat the boss before enrage",
    stageOverrides: {
      waveCount: 5,
      startingCoins: 460,
      rewardMultiplier: 1.28,
      gameplay: { ...getStageById(15).gameplay, waveDifficultyMultiplier: 1.02, waveSizeMultiplier: 0.92, spawnIntervalMultiplier: 0.9 },
      boss: { enabled: true, wave: 5, kind: 2, count: 1 },
    },
  }),
];

export const SIDE_MODE_LEVELS = [...RESOURCE_OPS, ...CHALLENGE_GAUNTLET] as const;

export function getSideModeLevel(id: string) {
  return SIDE_MODE_LEVELS.find((level) => level.id === id) ?? null;
}

export function getUnlockedSideModeLevels(
  levels: readonly SideModeLevel[],
  highestCompletedCampaignStage: number,
) {
  return levels.filter((level) => highestCompletedCampaignStage >= level.unlockStageId - 1);
}

export function getEndlessSector(wave: number) {
  return Math.max(1, Math.floor(Math.max(1, wave - 1) / 5) + 1);
}

export function getEndlessSectorLabel(wave: number) {
  const sector = getEndlessSector(wave);
  const names = ["Outskirts", "Crossroads", "Quarantine", "Red Zone", "Stronghold", "Blacksite"];
  return names[Math.min(names.length - 1, sector - 1)] ?? "Blacksite";
}

export function getEndlessMilestone(wave: number) {
  const next = Math.ceil(Math.max(1, wave + 0.01) / 5) * 5;
  return next;
}
