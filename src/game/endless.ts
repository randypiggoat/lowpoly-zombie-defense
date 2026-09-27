import { getStageById, type StageDefinition } from "./navigation";

export type ChallengePeriod = "daily" | "weekly" | "free";

export type EndlessChallenge = {
  id: string;
  period: ChallengePeriod;
  name: string;
  description: string;
  rewardMultiplier: number;
  gameplay: Partial<StageDefinition["gameplay"]>;
  startingBaseHealth?: number;
};

export const ENDLESS_CHALLENGES: EndlessChallenge[] = [
  {
    id: "free-siege",
    period: "free",
    name: "Endless Siege",
    description: "Classic endless defense. Enemy pressure keeps rising forever.",
    rewardMultiplier: 1,
    gameplay: {},
  },
  {
    id: "blood-rush",
    period: "daily",
    name: "Blood Rush",
    description: "+35% enemy speed. +25% rewards.",
    rewardMultiplier: 1.25,
    gameplay: { enemySpeedMultiplier: 1.35, spawnIntervalMultiplier: 0.85 },
  },
  {
    id: "iron-wall",
    period: "daily",
    name: "Iron Wall",
    description: "+45% enemy health. Base starts with 3 extra HP.",
    rewardMultiplier: 1.3,
    gameplay: { enemyHealthMultiplier: 1.45 },
    startingBaseHealth: 23,
  },
  {
    id: "small-arms",
    period: "daily",
    name: "Small Arms",
    description: "Enemy packs are smaller, but special enemies are more common.",
    rewardMultiplier: 1.2,
    gameplay: { waveSizeMultiplier: 0.82, waveDifficultyMultiplier: 1.18 },
  },
  {
    id: "night-shift",
    period: "weekly",
    name: "Night Shift",
    description: "Faster waves, stronger zombies, bigger rewards.",
    rewardMultiplier: 1.55,
    gameplay: {
      waveDifficultyMultiplier: 1.2,
      waveSizeMultiplier: 1.15,
      spawnIntervalMultiplier: 0.76,
      enemySpeedMultiplier: 1.12,
      enemyHealthMultiplier: 1.14,
    },
  },
  {
    id: "glass-house",
    period: "weekly",
    name: "Glass House",
    description: "Base health is reduced, but every reward is worth more.",
    rewardMultiplier: 1.75,
    gameplay: { waveDifficultyMultiplier: 1.1, enemyHealthMultiplier: 1.18 },
    startingBaseHealth: 12,
  },
];

export function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDailyChallenge(dateKey: string) {
  const candidates = ENDLESS_CHALLENGES.filter((entry) => entry.period === "daily");
  return candidates[hashString(dateKey) % candidates.length]!;
}

export function getWeeklyChallenge(weekKey: string) {
  const candidates = ENDLESS_CHALLENGES.filter((entry) => entry.period === "weekly");
  return candidates[hashString(weekKey) % candidates.length]!;
}

export function getWeekKey(value = new Date()) {
  const first = new Date(value.getFullYear(), 0, 1);
  const days = Math.floor((value.getTime() - first.getTime()) / 86400000);
  return `${value.getFullYear()}-W${Math.floor(days / 7) + 1}`;
}

export function createEndlessStage(challenge: EndlessChallenge): StageDefinition & { endless: true } {
  const base = getStageById(5);
  return {
    ...base,
    id: 999,
    stageNumber: 999,
    name: challenge.name,
    description: challenge.description,
    difficulty: "Hard",
    startingCoins: 240,
    startingBaseHealth: challenge.startingBaseHealth ?? 20,
    waveCount: 50,
    gameplay: {
      ...base.gameplay,
      waveDifficultyMultiplier: 1.05,
      waveSizeMultiplier: 1.05,
      spawnIntervalMultiplier: 0.94,
      waveDelayMultiplier: 0.86,
      enemySpeedMultiplier: 1.04,
      enemyHealthMultiplier: 1.04,
      ...challenge.gameplay,
    },
    boss: { enabled: false, wave: null, kind: null, count: 0 },
    rewardMultiplier: challenge.rewardMultiplier,
    specialRules: [challenge.description, "Boss siege every 10 waves", "Run powers every 3 waves"],
    endless: true,
  };
}
