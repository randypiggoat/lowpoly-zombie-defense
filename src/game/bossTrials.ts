import { getStageById, type StageDefinition, type StageEnemyKind } from "./navigation";

export type BossTrialTrait = {
  bossHealthMultiplier?: number;
  bossSpeedMultiplier?: number;
  bossEnrageHpRatio?: number;
  bossEnrageSpeedMultiplier?: number;
  bossSplitCount?: number;
  bossSplitHpMultiplier?: number;
  bossHealAmountMultiplier?: number;
  bossHealIntervalMultiplier?: number;
  bossHealTargetCount?: number;
  bossAuraDamageReduction?: number;
  bossBaseDamageMultiplier?: number;
};

export type BossTrialVariant = {
  id: string;
  name: string;
  description: string;
  gameplay: Partial<StageDefinition["gameplay"]>;
  startingBaseHealth?: number;
  startingCoins?: number;
  rewardMultiplier: number;
  traits: BossTrialTrait;
};

export type BossTrialDefinition = {
  id: string;
  bossKind: StageEnemyKind;
  bossName: string;
  title: string;
  description: string;
  enemyPool: StageDefinition["enemyPool"];
  baseGameplay: Partial<StageDefinition["gameplay"]>;
  baseStartingBaseHealth: number;
  baseStartingCoins: number;
  baseRewardMultiplier: number;
  variants: readonly BossTrialVariant[];
  variant?: BossTrialVariant;
};

const BRUTE: BossTrialDefinition = {
  id: "brute-rampage",
  bossKind: 2,
  bossName: "Brute",
  title: "RAMPAGE",
  description: "A heavyweight boss that turns the final lane into a speed-and-stopping-power test.",
  enemyPool: {
    normalKinds: [0, 1, 2, 5, 6],
    weights: { walker: 0.12, runner: 0.3, brute: 0.24, guardian: 0.2, healer: 0.14 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.3,
    waveSizeMultiplier: 1.2,
    spawnIntervalMultiplier: 0.84,
    waveDelayMultiplier: 0.9,
    enemySpeedMultiplier: 1.1,
    enemyHealthMultiplier: 1.12,
  },
  baseStartingBaseHealth: 16,
  baseStartingCoins: 250,
  baseRewardMultiplier: 1.8,
  variants: [
    {
      id: "redline",
      name: "REDLINE",
      description: "The boss enrages earlier and accelerates harder.",
      gameplay: { enemySpeedMultiplier: 1.08 },
      rewardMultiplier: 1.9,
      traits: { bossEnrageHpRatio: 0.65, bossEnrageSpeedMultiplier: 1.5 },
    },
    {
      id: "ironblood",
      name: "IRON BLOOD",
      description: "More boss health. Normal enemies stay slightly lighter to keep the fight focused.",
      gameplay: { enemyHealthMultiplier: 1.05, waveSizeMultiplier: 1.14 },
      rewardMultiplier: 2,
      traits: { bossHealthMultiplier: 2.15 },
    },
    {
      id: "no-escape",
      name: "NO ESCAPE",
      description: "The base starts fragile while the entire arena moves faster.",
      gameplay: { enemySpeedMultiplier: 1.16, spawnIntervalMultiplier: 0.78 },
      startingBaseHealth: 12,
      rewardMultiplier: 2.05,
      traits: { bossSpeedMultiplier: 1.15 },
    },
  ],
};

const SPLITTER: BossTrialDefinition = {
  id: "splitter-mitosis",
  bossKind: 3,
  bossName: "Splitter",
  title: "MITOSIS",
  description: "The boss is only the beginning: destroying it creates a final swarm collapse.",
  enemyPool: {
    normalKinds: [0, 1, 3, 7],
    weights: { walker: 0.18, runner: 0.24, splitter: 0.28, swarm: 0.3 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.28,
    waveSizeMultiplier: 1.3,
    spawnIntervalMultiplier: 0.82,
    waveDelayMultiplier: 0.9,
    enemySpeedMultiplier: 1.1,
    enemyHealthMultiplier: 1.08,
  },
  baseStartingBaseHealth: 16,
  baseStartingCoins: 245,
  baseRewardMultiplier: 1.85,
  variants: [
    {
      id: "hive-bloom",
      name: "HIVE BLOOM",
      description: "The boss explodes into a dense pack of tiny followers.",
      gameplay: { waveSizeMultiplier: 1.34 },
      rewardMultiplier: 1.95,
      traits: { bossSplitCount: 6, bossSplitHpMultiplier: 0.38 },
    },
    {
      id: "chain-reaction",
      name: "CHAIN REACTION",
      description: "The entire wave carries stronger split pressure.",
      gameplay: { waveDifficultyMultiplier: 1.36, enemyHealthMultiplier: 1.12 },
      rewardMultiplier: 2,
      traits: { bossSplitCount: 4, bossSplitHpMultiplier: 0.52 },
    },
    {
      id: "thin-ice",
      name: "THIN ICE",
      description: "Fast runners rush the gaps while the boss leaves a smaller swarm behind.",
      gameplay: { enemySpeedMultiplier: 1.16, spawnIntervalMultiplier: 0.76 },
      rewardMultiplier: 2.05,
      traits: { bossSplitCount: 3, bossSplitHpMultiplier: 0.58 },
    },
  ],
};

const BOMBER: BossTrialDefinition = {
  id: "bomber-meltdown",
  bossKind: 4,
  bossName: "Bomber",
  title: "MELTDOWN",
  description: "A volatile boss built around panic: let it through and the base pays a brutal price.",
  enemyPool: {
    normalKinds: [1, 3, 4, 7],
    weights: { runner: 0.32, splitter: 0.18, bomber: 0.24, swarm: 0.26 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.32,
    waveSizeMultiplier: 1.22,
    spawnIntervalMultiplier: 0.8,
    waveDelayMultiplier: 0.88,
    enemySpeedMultiplier: 1.14,
    enemyHealthMultiplier: 1.08,
  },
  baseStartingBaseHealth: 15,
  baseStartingCoins: 255,
  baseRewardMultiplier: 1.9,
  variants: [
    {
      id: "live-wire",
      name: "LIVE WIRE",
      description: "The boss is faster and normal bombers arrive more often.",
      gameplay: { enemySpeedMultiplier: 1.2, waveSizeMultiplier: 1.26 },
      rewardMultiplier: 2,
      traits: { bossSpeedMultiplier: 1.18, bossBaseDamageMultiplier: 1.65 },
    },
    {
      id: "last-fuse",
      name: "LAST FUSE",
      description: "The base can absorb less punishment, but boss health is lower.",
      gameplay: { enemyHealthMultiplier: 1.02, spawnIntervalMultiplier: 0.74 },
      startingBaseHealth: 12,
      rewardMultiplier: 2.08,
      traits: { bossHealthMultiplier: 0.86, bossBaseDamageMultiplier: 1.9 },
    },
    {
      id: "blast-radius",
      name: "BLAST RADIUS",
      description: "Heavy mixed waves surround a boss that hits the base exceptionally hard.",
      gameplay: { waveDifficultyMultiplier: 1.42, waveSizeMultiplier: 1.3 },
      rewardMultiplier: 2.15,
      traits: { bossHealthMultiplier: 1.25, bossBaseDamageMultiplier: 2.1 },
    },
  ],
};

const GUARDIAN: BossTrialDefinition = {
  id: "guardian-bulwark",
  bossKind: 5,
  bossName: "Guardian",
  title: "BULWARK",
  description: "A walking fortress that makes the enemies around it harder to bring down.",
  enemyPool: {
    normalKinds: [2, 5, 6, 1],
    weights: { brute: 0.26, guardian: 0.26, healer: 0.2, runner: 0.28 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.25,
    waveSizeMultiplier: 1.18,
    spawnIntervalMultiplier: 0.86,
    waveDelayMultiplier: 0.92,
    enemySpeedMultiplier: 1.04,
    enemyHealthMultiplier: 1.15,
  },
  baseStartingBaseHealth: 17,
  baseStartingCoins: 250,
  baseRewardMultiplier: 1.9,
  variants: [
    {
      id: "fortress",
      name: "FORTRESS",
      description: "Nearby enemies gain a strong defensive shell while the boss becomes tougher.",
      gameplay: { enemyHealthMultiplier: 1.2 },
      rewardMultiplier: 2,
      traits: { bossHealthMultiplier: 1.8, bossAuraDamageReduction: 0.16 },
    },
    {
      id: "convoy",
      name: "CONVOY",
      description: "Fast support units stay clustered around the boss and force concentrated damage.",
      gameplay: { enemySpeedMultiplier: 1.12, waveSizeMultiplier: 1.24 },
      rewardMultiplier: 2.08,
      traits: { bossAuraDamageReduction: 0.18, bossEnrageHpRatio: 0.55, bossEnrageSpeedMultiplier: 1.44 },
    },
    {
      id: "siege-line",
      name: "SIEGE LINE",
      description: "The boss is slower, bulkier, and backed by a heavier wave pattern.",
      gameplay: { enemyHealthMultiplier: 1.22, enemySpeedMultiplier: 0.98 },
      rewardMultiplier: 2.1,
      traits: { bossHealthMultiplier: 2, bossSpeedMultiplier: 0.9, bossAuraDamageReduction: 0.2 },
    },
  ],
};

const HEALER: BossTrialDefinition = {
  id: "healer-plague",
  bossKind: 6,
  bossName: "Healer",
  title: "PLAGUE ENGINE",
  description: "A support boss that turns target priority into the entire fight.",
  enemyPool: {
    normalKinds: [2, 5, 6, 3, 1],
    weights: { brute: 0.18, guardian: 0.22, healer: 0.24, splitter: 0.16, runner: 0.2 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.3,
    waveSizeMultiplier: 1.2,
    spawnIntervalMultiplier: 0.84,
    waveDelayMultiplier: 0.88,
    enemySpeedMultiplier: 1.08,
    enemyHealthMultiplier: 1.1,
  },
  baseStartingBaseHealth: 15,
  baseStartingCoins: 255,
  baseRewardMultiplier: 1.95,
  variants: [
    {
      id: "mass-revival",
      name: "MASS REVIVAL",
      description: "The boss heals two allies at a time with a much shorter recovery window.",
      gameplay: { enemyHealthMultiplier: 1.14 },
      rewardMultiplier: 2.08,
      traits: { bossHealAmountMultiplier: 1.5, bossHealIntervalMultiplier: 0.68, bossHealTargetCount: 2 },
    },
    {
      id: "toxic-clock",
      name: "TOXIC CLOCK",
      description: "Waves arrive faster, and the boss becomes harder to burst down.",
      gameplay: { spawnIntervalMultiplier: 0.72, waveSizeMultiplier: 1.28 },
      rewardMultiplier: 2.12,
      traits: { bossHealthMultiplier: 1.45, bossHealAmountMultiplier: 1.35, bossHealIntervalMultiplier: 0.76 },
    },
    {
      id: "triage",
      name: "TRIAGE",
      description: "Guardians and brutes create deliberate targets for the boss to sustain.",
      gameplay: { enemyHealthMultiplier: 1.2 },
      rewardMultiplier: 2.15,
      traits: { bossHealAmountMultiplier: 1.7, bossHealIntervalMultiplier: 0.8, bossHealTargetCount: 2 },
    },
  ],
};

const SWARM: BossTrialDefinition = {
  id: "swarm-hive",
  bossKind: 7,
  bossName: "Swarm",
  title: "HIVEHEART",
  description: "A tiny target with a huge aftermath: speed, numbers, and target saturation.",
  enemyPool: {
    normalKinds: [1, 3, 4, 7],
    weights: { runner: 0.3, splitter: 0.2, bomber: 0.14, swarm: 0.36 },
  },
  baseGameplay: {
    waveDifficultyMultiplier: 1.34,
    waveSizeMultiplier: 1.5,
    spawnIntervalMultiplier: 0.72,
    waveDelayMultiplier: 0.82,
    enemySpeedMultiplier: 1.2,
    enemyHealthMultiplier: 0.92,
  },
  baseStartingBaseHealth: 15,
  baseStartingCoins: 245,
  baseRewardMultiplier: 2,
  variants: [
    {
      id: "stampede",
      name: "STAMPEDE",
      description: "Everything moves faster and the boss leaves a larger hive behind.",
      gameplay: { enemySpeedMultiplier: 1.28, waveSizeMultiplier: 1.56 },
      rewardMultiplier: 2.1,
      traits: { bossSpeedMultiplier: 1.2, bossSplitCount: 8, bossSplitHpMultiplier: 0.38 },
    },
    {
      id: "needlepoint",
      name: "NEEDLEPOINT",
      description: "The boss is fragile, but runner pressure spikes everywhere else.",
      gameplay: { enemyHealthMultiplier: 0.88, enemySpeedMultiplier: 1.32 },
      rewardMultiplier: 2.14,
      traits: { bossHealthMultiplier: 0.72, bossSpeedMultiplier: 1.32, bossSplitCount: 7, bossSplitHpMultiplier: 0.32 },
    },
    {
      id: "black-cloud",
      name: "BLACK CLOUD",
      description: "Huge waves trade raw health for constant target saturation.",
      gameplay: { waveSizeMultiplier: 1.68, spawnIntervalMultiplier: 0.66, enemyHealthMultiplier: 0.86 },
      rewardMultiplier: 2.18,
      traits: { bossSpeedMultiplier: 1.18, bossSplitCount: 10, bossSplitHpMultiplier: 0.3 },
    },
  ],
};

export const BOSS_TRIAL_ROSTER = [BRUTE, SPLITTER, BOMBER, GUARDIAN, HEALER, SWARM] as const;

export function getBossTrialVariant(trial: BossTrialDefinition, weekKey: string) {
  const hash = hashString(`${weekKey}:${trial.id}`);
  return trial.variants[hash % trial.variants.length]!;
}

export function getWeeklyBossTrial(weekKey: string): BossTrialDefinition {
  const weekMatch = /^(\d{4})-W(\d+)$/.exec(weekKey);
  const rotationIndex = weekMatch
    ? Number(weekMatch[1]) * 53 + Number(weekMatch[2])
    : hashString(`boss:${weekKey}`);
  const baseIndex = Math.abs(rotationIndex) % BOSS_TRIAL_ROSTER.length;
  const base = BOSS_TRIAL_ROSTER[baseIndex]!;
  const variant = getBossTrialVariant(base, weekKey);
  return { ...base, variant };
}

export function createBossTrialStage(trial: BossTrialDefinition): StageDefinition & {
  bossTrial: true;
  bossTrialId: string;
} {
  const base = getStageById(5);
  const variant = trial.variant;
  return {
    ...base,
    id: 1000,
    stageNumber: 1000,
    name: `Boss Trial · ${trial.bossName}`,
    description: trial.description,
    difficulty: "Hard",
    startingCoins: variant?.startingCoins ?? trial.baseStartingCoins,
    startingBaseHealth: variant?.startingBaseHealth ?? trial.baseStartingBaseHealth,
    waveCount: 8,
    enemyPool: trial.enemyPool,
    gameplay: {
      ...base.gameplay,
      ...trial.baseGameplay,
      ...(variant?.gameplay ?? {}),
    },
    boss: { enabled: true, wave: 8, kind: trial.bossKind, count: 1 },
    rewardMultiplier: variant?.rewardMultiplier ?? trial.baseRewardMultiplier,
    specialRules: [
      trial.title,
      variant ? `${variant.name}: ${variant.description}` : trial.description,
      "Boss Trial: no random run powers",
      "Defeat the boss to clear the trial",
    ],
    rewards: {
      completionCoins: 180,
      completionXp: 300,
      completionStars: 0,
      firstCompletionBonus: { coins: 100, xp: 180, stars: 0 },
    },
    objectives: [{ id: "boss-clear", label: `Defeat the ${trial.bossName} boss`, type: "complete-stage" }],
    placeholder: false,
    bossTrial: true,
    bossTrialId: trial.id,
  };
}

export function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
