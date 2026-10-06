import {
  getSeasonalEvent,
  getSeasonalEventCycleKey,
  getSeasonalMilestoneProgress,
  type SeasonalActivity,
} from "./liveOps";
import {
  FIELD_KNOWLEDGE,
  knowledgeUnlocked,
  resolveFieldKnowledgeEffects,
  type FieldKnowledgeEffects,
} from "./fieldKnowledge";
import { TOWER_COSMETICS, ZOMBIE_COSMETICS } from "./collection";
// Persistent player progression. Stored client-side in localStorage.
import { STAGE_DEFS, getNextStageId } from "./navigation";
import { progressionXpForKill, progressionXpForRun, progressionXpForWave, xpForLevel as progressionXpForLevel } from "./progression";

const KEY = "rotwood.profile.v1";
const PROFILE_VERSION = 5;
const STARTER_TOWER_KINDS = ["rifleman", "shotgunner", "freezer"] as const;

export type RewardGrant = {
  label: string;
  coins?: number;
  gems?: number;
  xp?: number;
};

export type AchievementProgress = {
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  updatedAt: string | null;
  completedAt: string | null;
  claimedAt: string | null;
};

export type DailyMissionProgress = AchievementProgress;

export type DailyMissionEvent = "zombieKill" | "waveReached" | "gameCompleted";

export type DailyMissionDefinition = {
  id: string;
  description: string;
  target: number;
  event: DailyMissionEvent;
  reward: RewardGrant;
  mode?: "increment" | "max";
};

export type AchievementMetric =
  "totalKills" | "highestWave" | "bruteKills" | "towerUpgradeActions" | "starterTowersBuilt";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: AchievementMetric;
  reward: RewardGrant;
};

export type DailyLoginRewardDefinition = {
  day: number;
  title: string;
  reward: RewardGrant;
};

export const DAILY_MISSION_DEFS: DailyMissionDefinition[] = [
  {
    id: "daily-kill-100",
    description: "Kill 100 zombies",
    target: 100,
    event: "zombieKill",
    reward: { label: "150 credits", coins: 150 },
  },
  {
    id: "daily-wave-15",
    description: "Survive Wave 15",
    target: 15,
    event: "waveReached",
    mode: "max",
    reward: { label: "5 gems", gems: 5 },
  },
  {
    id: "daily-play-3",
    description: "Play 3 games",
    target: 3,
    event: "gameCompleted",
    reward: { label: "80 XP", xp: 80 },
  },
];

export const ACHIEVEMENT_DEFS: AchievementDefinition[] = [
  {
    id: "first-blood",
    title: "First Blood",
    description: "Kill your first zombie.",
    target: 1,
    metric: "totalKills",
    reward: { label: "50 credits", coins: 50 },
  },
  {
    id: "zombie-hunter",
    title: "100 Zombies Killed",
    description: "Kill 100 zombies.",
    target: 100,
    metric: "totalKills",
    reward: { label: "5 gems", gems: 5 },
  },
  {
    id: "zombie-slayer",
    title: "1,000 Zombies Killed",
    description: "Kill 1,000 zombies.",
    target: 1000,
    metric: "totalKills",
    reward: { label: "20 gems", gems: 20 },
  },
  {
    id: "wave-10",
    title: "Reach Wave 10",
    description: "Reach Wave 10 in any run.",
    target: 10,
    metric: "highestWave",
    reward: { label: "150 credits", coins: 150 },
  },
  {
    id: "wave-25",
    title: "Reach Wave 25",
    description: "Reach Wave 25 in any run.",
    target: 25,
    metric: "highestWave",
    reward: { label: "100 XP", xp: 100 },
  },
  {
    id: "wave-50",
    title: "Reach Wave 50",
    description: "Reach Wave 50 in any run.",
    target: 50,
    metric: "highestWave",
    reward: { label: "12 gems", gems: 12 },
  },
  {
    id: "first-boss",
    title: "Defeat First Boss",
    description: "Take down your first Brute.",
    target: 1,
    metric: "bruteKills",
    reward: { label: "8 gems", gems: 8 },
  },
  {
    id: "upgrade-first-tower",
    title: "Upgrade First Tower",
    description: "Upgrade any tower once.",
    target: 1,
    metric: "towerUpgradeActions",
    reward: { label: "100 credits", coins: 100 },
  },
  {
    id: "starter-towers",
    title: "Unlock All Starter Towers",
    description: "Build Rifleman, Shotgunner, and Freezer once.",
    target: STARTER_TOWER_KINDS.length,
    metric: "starterTowersBuilt",
    reward: { label: "6 gems", gems: 6 },
  },
];

export const DAILY_LOGIN_REWARDS: DailyLoginRewardDefinition[] = [
  { day: 1, title: "Credits", reward: { label: "120 credits", coins: 120 } },
  { day: 2, title: "Credits", reward: { label: "180 credits", coins: 180 } },
  { day: 3, title: "Gems", reward: { label: "6 gems", gems: 6 } },
  { day: 4, title: "XP Boost", reward: { label: "60 XP", xp: 60 } },
  {
    day: 5,
    title: "Rare Reward",
    reward: { label: "Rare cache · 260 credits + 4 gems", coins: 260, gems: 4 },
  },
  { day: 6, title: "Gems", reward: { label: "10 gems", gems: 10 } },
  {
    day: 7,
    title: "Special Reward",
    reward: {
      label: "Special cache · 400 credits + 12 gems + 320 XP",
      coins: 400,
      gems: 12,
      xp: 320,
    },
  },
];

export type PlayerProfile = {
  version: number;
  xp: number;
  level: number;
  coins: number;
  gems: number;
  highestWave: number;
  totalKills: number;
  bruteKills: number;
  gamesPlayed: number;
  towerUpgradeActions: number;
  builtTowerKinds: string[];
  dailyMissionDate: string | null;
  loginCycleDay: number;
  lastLoginClaimDate: string | null;
  lastLoginRewardDayClaimed: number | null;
  /** Date on which the optional rewarded-ad daily bonus was claimed. */
  dailyRewardedBonusDate: string | null;
  /** Legacy Workshop data retained only for save compatibility; no longer affects combat. */
  towerUpgrades: Record<string, TowerUpgradeProfile>;
  /** Permanent account-wide Field Knowledge nodes. */
  fieldKnowledge: Record<string, number>;
  /** Tower kinds unlocked ahead of their level gate. */
  unlockedTowers: string[];
  /** Persistent mastery earned by actively upgrading each tower. */
  towerMasteryXp: Record<string, number>;
  equippedZombieCosmetic: string;
  achievements: Record<string, AchievementProgress>;
  dailyMissionProgress: Record<string, DailyMissionProgress>;
  stageProgress: Record<string, StageProgress>;
  endlessBestWave: number;
  endlessBestScore: number;
  dailyChallengeDate: string | null;
  dailyChallengeBestScore: number;
  weeklyChallengeKey: string | null;
  weeklyChallengeBestScore: number;
  bossTrialWeekKey: string | null;
  bossTrialBestScore: number;
  bossTrialClears: Record<string, number>;
  bossTrialMastery: Record<string, number>;
  sideModeBestScores: Record<string, number>;
  sideModeClears: Record<string, number>;
  equippedTowerCosmetics: Record<string, string>;
  seasonalEventCycleKey: string;
  seasonalEventProgress: number;
  seasonalEventActivityProgress: Record<Exclude<SeasonalActivity, "kills">, number>;
  seasonalEventClaims: string[];
  seasonalEventUnlocks: string[];
  /** Whether the player prefers reduced motion effects. */
  reducedMotion: boolean;
  /** Whether the player has purchased the permanent ad-removal entitlement. */
  adsRemoved: boolean;
};

export type StageProgress = {
  unlocked: boolean;
  completed: boolean;
  bestWave: number;
  stars: number;
};

export type TowerUpgradeProfile = {
  level: number;
  points: number;
  spentCoins: number;
};

export type RunReward = {
  wave: number;
  kills: number;
  xp: number;
  coins: number;
  gems: number;
  leveledTo: number | null;
  newRecord: boolean;
  stageId: number | null;
  stageCompleted: boolean;
  starsEarned: number;
  firstCompletionBonusApplied: boolean;
  bestStars: number;
  previousBestWave: number;
  previousBestStars: number;
  /** Score for side-mode/endless/boss-trial results when applicable. */
  score?: number;
};

export type LevelUpNotice = {
  id: number;
  level: number;
};

export function dateKey(value = new Date()) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function blankProgress(target: number): AchievementProgress {
  return {
    progress: 0,
    target,
    completed: false,
    claimed: false,
    updatedAt: null,
    completedAt: null,
    claimedAt: null,
  };
}

function blankDailyProgress(date: string): Record<string, DailyMissionProgress> {
  return Object.fromEntries(
    DAILY_MISSION_DEFS.map((mission) => [
      mission.id,
      { ...blankProgress(mission.target), updatedAt: date },
    ]),
  );
}

function blankStageProgress(unlocked: boolean): StageProgress {
  return {
    unlocked,
    completed: false,
    bestWave: 0,
    stars: 0,
  };
}

function defaultStageProgress(): Record<string, StageProgress> {
  return Object.fromEntries(
    STAGE_DEFS.map((stage) => [String(stage.id), blankStageProgress(stage.id === 1)]),
  );
}

function blank(): PlayerProfile {
  const today = dateKey();
  return {
    version: PROFILE_VERSION,
    xp: 0,
    level: 1,
    coins: 0,
    gems: 0,
    highestWave: 0,
    totalKills: 0,
    bruteKills: 0,
    gamesPlayed: 0,
    towerUpgradeActions: 0,
    builtTowerKinds: [],
    dailyMissionDate: today,
    loginCycleDay: 1,
    lastLoginClaimDate: null,
    lastLoginRewardDayClaimed: null,
    dailyRewardedBonusDate: null,
    towerUpgrades: {},
    fieldKnowledge: {},
    unlockedTowers: [],
    towerMasteryXp: {},
    equippedZombieCosmetic: "zombie-default",
    achievements: {},
    dailyMissionProgress: blankDailyProgress(today),
    stageProgress: defaultStageProgress(),
    endlessBestWave: 0,
    endlessBestScore: 0,
    dailyChallengeDate: today,
    dailyChallengeBestScore: 0,
    weeklyChallengeKey: null,
    weeklyChallengeBestScore: 0,
    bossTrialWeekKey: null,
    bossTrialBestScore: 0,
    bossTrialClears: {},
    bossTrialMastery: {},
    sideModeBestScores: {},
    sideModeClears: {},
    equippedTowerCosmetics: {},
    seasonalEventCycleKey: getSeasonalEventCycleKey(),
    seasonalEventProgress: 0,
    seasonalEventActivityProgress: {
      waves: 0,
      runs: 0,
      "tower-upgrades": 0,
      "special-kills": 0,
    },
    seasonalEventClaims: [],
    seasonalEventUnlocks: [],
    adsRemoved: false,
    reducedMotion: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTowerUpgrades(value: unknown): Record<string, TowerUpgradeProfile> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([kind, raw]) => {
      const entry = isRecord(raw) ? raw : {};
      return [
        kind,
        {
          level: Math.max(0, Number(entry['level']) || 0),
          points: Math.max(0, Number(entry['points']) || 0),
          spentCoins: Math.max(0, Number(entry['spentCoins']) || 0),
        },
      ];
    }),
  );
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [key, Math.max(0, Number(raw) || 0)]),
  );
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function normalizeDate(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeDay(value: unknown): number {
  const num = Math.floor(Number(value) || 1);
  return Math.min(7, Math.max(1, num));
}

function normalizeClaimProgressRecords(value: unknown): Record<string, AchievementProgress> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([id, raw]) => {
      const entry = isRecord(raw) ? raw : {};
      const target = Math.max(0, Number(entry['target']) || 0);
      const progress = Math.max(0, Number(entry['progress']) || 0);
      return [
        id,
        {
          progress,
          target,
          completed: Boolean(entry['completed']) || (target > 0 && progress >= target),
          claimed: Boolean(entry['claimed']),
          updatedAt: normalizeDate(entry['updatedAt']),
          completedAt: normalizeDate(entry['completedAt']),
          claimedAt: normalizeDate(entry['claimedAt']),
        },
      ];
    }),
  );
}

function normalizeStageProgressRecords(value: unknown): Record<string, StageProgress> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([id, raw]) => {
      const entry = isRecord(raw) ? raw : {};
      return [
        id,
        {
          unlocked: Boolean(entry['unlocked']),
          completed: Boolean(entry['completed']),
          bestWave: Math.max(0, Number(entry['bestWave']) || 0),
          stars: Math.min(3, Math.max(0, Number(entry['stars']) || 0)),
        },
      ];
    }),
  );
}

function ensureStageProgressState(profile: PlayerProfile) {
  let changed = false;
  for (const stage of STAGE_DEFS) {
    const key = String(stage.id);
    const existing = profile.stageProgress[key];
    if (!existing) {
      profile.stageProgress[key] = blankStageProgress(stage.id === 1);
      changed = true;
      continue;
    }
    if (stage.id === 1 && !existing.unlocked) {
      existing.unlocked = true;
      changed = true;
    }
    const clampedStars = Math.min(3, Math.max(0, existing.stars));
    if (existing.stars !== clampedStars) {
      existing.stars = clampedStars;
      changed = true;
    }
    if (existing.completed) {
      const nextStageId = getNextStageId(stage.id);
      if (nextStageId !== null) {
        const nextKey = String(nextStageId);
        const nextStage = profile.stageProgress[nextKey] ?? blankStageProgress(false);
        if (!profile.stageProgress[nextKey]) profile.stageProgress[nextKey] = nextStage;
        if (!nextStage.unlocked) {
          nextStage.unlocked = true;
          changed = true;
        }
      }
    }
  }
  return changed;
}

function ensureDailyMissionState(profile: PlayerProfile, today: string) {
  if (profile.dailyMissionDate !== today) {
    profile.dailyMissionDate = today;
    profile.dailyMissionProgress = blankDailyProgress(today);
    return true;
  }

  let changed = false;
  for (const mission of DAILY_MISSION_DEFS) {
    const entry = profile.dailyMissionProgress[mission.id];
    if (!entry || entry['target'] !== mission.target) {
      profile.dailyMissionProgress[mission.id] = {
        ...blankProgress(mission.target),
        progress: Math.min(mission.target, entry?.progress ?? 0),
        completed: Boolean(entry?.completed),
        claimed: Boolean(entry?.claimed),
        updatedAt: entry?.updatedAt ?? today,
        completedAt: entry?.completedAt ?? null,
        claimedAt: entry?.claimedAt ?? null,
      };
      changed = true;
    }
  }
  return changed;
}

function achievementMetricValue(metric: AchievementMetric, profile: PlayerProfile) {
  switch (metric) {
    case "totalKills":
      return profile.totalKills;
    case "highestWave":
      return profile.highestWave;
    case "bruteKills":
      return profile.bruteKills;
    case "towerUpgradeActions":
      return profile.towerUpgradeActions;
    case "starterTowersBuilt":
      return STARTER_TOWER_KINDS.filter((kind) => profile.builtTowerKinds.includes(kind)).length;
  }
}

function syncAchievements(profile: PlayerProfile, stamp: string) {
  let changed = false;
  for (const achievement of ACHIEVEMENT_DEFS) {
    const progress = Math.min(
      achievement.target,
      achievementMetricValue(achievement.metric, profile),
    );
    const entry = profile.achievements[achievement.id] ?? blankProgress(achievement.target);
    const completed = progress >= achievement.target;
    const next: AchievementProgress = {
      progress,
      target: achievement.target,
      completed,
      claimed: entry['claimed'],
      updatedAt: progress !== entry['progress'] || entry['updatedAt'] === null ? stamp : entry['updatedAt'],
      completedAt: completed ? (entry['completedAt'] ?? stamp) : null,
      claimedAt: entry['claimedAt'] ?? null,
    };
    if (
      !profile.achievements[achievement.id] ||
      entry['progress'] !== next.progress ||
      entry['target'] !== next.target ||
      entry['completed'] !== next.completed ||
      entry['claimed'] !== next.claimed ||
      entry['updatedAt'] !== next.updatedAt ||
      entry['completedAt'] !== next.completedAt ||
      entry['claimedAt'] !== next.claimedAt
    ) {
      profile.achievements[achievement.id] = next;
      changed = true;
    }
  }
  return changed;
}

function load(): PlayerProfile {
  if (typeof localStorage === "undefined") return blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const today = dateKey();
    const merged: PlayerProfile = {
      ...blank(),
      ...parsed,
      version: PROFILE_VERSION,
      bruteKills: Math.max(0, Number(parsed.bruteKills) || 0),
      towerUpgradeActions: Math.max(0, Number(parsed.towerUpgradeActions) || 0),
      builtTowerKinds: normalizeStringArray(parsed.builtTowerKinds),
      dailyMissionDate: normalizeDate(parsed.dailyMissionDate),
      loginCycleDay: normalizeDay(parsed.loginCycleDay),
      lastLoginClaimDate: normalizeDate(parsed.lastLoginClaimDate),
      lastLoginRewardDayClaimed:
        parsed.lastLoginRewardDayClaimed == null
          ? null
          : normalizeDay(parsed.lastLoginRewardDayClaimed),
      towerUpgrades: normalizeTowerUpgrades(parsed.towerUpgrades),
      fieldKnowledge: isRecord(parsed.fieldKnowledge)
        ? Object.fromEntries(
            Object.entries(parsed.fieldKnowledge).filter(([id, rank]) => FIELD_KNOWLEDGE.some((node) => node.id === id) && Number(rank) > 0).map(([id]) => [id, 1]),
          )
        : {},
      unlockedTowers: normalizeStringArray(parsed.unlockedTowers),
      towerMasteryXp: normalizeNumberRecord(parsed.towerMasteryXp),
      equippedZombieCosmetic: typeof parsed.equippedZombieCosmetic === "string" ? parsed.equippedZombieCosmetic : "zombie-default",
      achievements: normalizeClaimProgressRecords(parsed.achievements),
      dailyMissionProgress: normalizeClaimProgressRecords(parsed.dailyMissionProgress),
      stageProgress: normalizeStageProgressRecords(parsed.stageProgress),
      endlessBestWave: Math.max(0, Number(parsed.endlessBestWave) || 0),
      endlessBestScore: Math.max(0, Number(parsed.endlessBestScore) || 0),
      dailyChallengeDate: normalizeDate(parsed.dailyChallengeDate) ?? today,
      dailyChallengeBestScore: Math.max(0, Number(parsed.dailyChallengeBestScore) || 0),
      weeklyChallengeKey: normalizeDate(parsed.weeklyChallengeKey),
      weeklyChallengeBestScore: Math.max(0, Number(parsed.weeklyChallengeBestScore) || 0),
      bossTrialWeekKey: normalizeDate(parsed.bossTrialWeekKey),
      bossTrialBestScore: Math.max(0, Number(parsed.bossTrialBestScore) || 0),
      bossTrialClears: isRecord(parsed.bossTrialClears)
        ? Object.fromEntries(Object.entries(parsed.bossTrialClears).filter(([, value]) => Number(value) >= 0).map(([id, value]) => [id, Math.floor(Number(value))]))
        : {},
      bossTrialMastery: isRecord(parsed.bossTrialMastery)
        ? Object.fromEntries(Object.entries(parsed.bossTrialMastery).filter(([, value]) => Number(value) >= 0).map(([id, value]) => [id, Math.min(3, Math.floor(Number(value)))]))
        : {},
      sideModeBestScores: isRecord(parsed.sideModeBestScores)
        ? Object.fromEntries(
            Object.entries(parsed.sideModeBestScores).filter(([, score]) => Number(score) >= 0).map(([id, score]) => [id, Math.floor(Number(score))]),
          )
        : {},
      sideModeClears: isRecord(parsed.sideModeClears)
        ? Object.fromEntries(
            Object.entries(parsed.sideModeClears).filter(([, clears]) => Number(clears) >= 0).map(([id, clears]) => [id, Math.floor(Number(clears))]),
          )
        : {},
      equippedTowerCosmetics: isRecord(parsed.equippedTowerCosmetics)
        ? Object.fromEntries(
            Object.entries(parsed.equippedTowerCosmetics).filter(
              ([kind, cosmetic]) => typeof kind === "string" && typeof cosmetic === "string",
            ),
          )
        : {},
      seasonalEventCycleKey:
        normalizeDate(parsed.seasonalEventCycleKey) ?? getSeasonalEventCycleKey(),
      seasonalEventProgress: Math.max(0, Number(parsed.seasonalEventProgress) || 0),
      seasonalEventActivityProgress: {
        waves: 0,
        runs: 0,
        "tower-upgrades": 0,
        "special-kills": 0,
        ...normalizeNumberRecord(parsed.seasonalEventActivityProgress),
      },
      seasonalEventClaims: normalizeStringArray(parsed.seasonalEventClaims),
      seasonalEventUnlocks: normalizeStringArray(parsed.seasonalEventUnlocks),
      reducedMotion: Boolean(parsed.reducedMotion),
    };
    ensureDailyMissionState(merged, today);
    syncAchievements(merged, today);
    ensureStageProgressState(merged);
    const stageOne = merged.stageProgress["1"];
    if (stageOne && merged.highestWave > stageOne.bestWave) {
      stageOne.bestWave = merged.highestWave;
      if (stageOne.bestWave > 0) stageOne.completed = true;
      const legacyStars =
        stageOne.bestWave >= 20 ? 3 : stageOne.bestWave >= 12 ? 2 : stageOne.bestWave >= 6 ? 1 : 0;
      stageOne.stars = Math.max(stageOne.stars, legacyStars);
    }
    if (stageOne?.completed) {
      const stageTwo = merged.stageProgress["2"];
      if (stageTwo && !stageTwo.unlocked) {
        stageTwo.unlocked = true;
      }
    }
    return merged;
  } catch {
    return blank();
  }
}

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return progressionXpForLevel(level);
}

/** XP accumulated inside the current level. */
export function xpIntoLevel(p: PlayerProfile): number {
  return p.xp;
}

class ProfileStore {
  private data: PlayerProfile = blank();
  private loaded = false;
  private listeners = new Set<() => void>();

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    if (this.loaded) return;
    this.data = load();
    this.loaded = true;
  }
  private revision = 0;
  private fieldKnowledgeRevision = 0;
  private cachedFieldKnowledgeEffects: FieldKnowledgeEffects | null = null;
  private lastRunRewardBoosted = false;
  private lastBossTrialId: string | null = null;
  /** Combat progression is batched so a kill never forces synchronous JSON/localStorage work. */
  private unsavedCombatKills = 0;

  get canClaimLastRunRewardBoost() {
    return Boolean(this.lastReward) && !this.lastRunRewardBoosted;
  }

  private levelUpNoticeId = 0;
  lastReward: RunReward | null = null;
  levelUpNotice: LevelUpNotice | null = null;

  get profile(): PlayerProfile {
    this.hydrate();
    return this.data;
  }

  get snapshot() {
    return this.revision;
  }


  fieldKnowledgeRank(id: string) {
    return this.profile.fieldKnowledge[id] ?? 0;
  }

  fieldKnowledgeVersion() {
    return this.fieldKnowledgeRevision;
  }

  fieldKnowledgeEffects() {
    if (this.cachedFieldKnowledgeEffects === null) {
      this.cachedFieldKnowledgeEffects = resolveFieldKnowledgeEffects(this.profile.fieldKnowledge);
    }
    return this.cachedFieldKnowledgeEffects;
  }

  canUnlockFieldKnowledge(id: string) {
    const node = FIELD_KNOWLEDGE.find((entry) => entry.id === id);
    if (!node || this.fieldKnowledgeRank(id) > 0) return false;
    return knowledgeUnlocked(node, this.profile.fieldKnowledge);
  }

  unlockFieldKnowledge(id: string) {
    const node = FIELD_KNOWLEDGE.find((entry) => entry.id === id);
    const p = this.profile;
    if (!node || (p.fieldKnowledge[id] ?? 0) > 0) return false;
    if (!knowledgeUnlocked(node, p.fieldKnowledge)) return false;
    if (p.coins < node.cost) return false;
    p.coins -= node.cost;
    p.fieldKnowledge[id] = 1;
    this.fieldKnowledgeRevision += 1;
    this.cachedFieldKnowledgeEffects = null;
    this.save();
    return true;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.revision += 1;
    this.listeners.forEach((l) => l());
  }

  private refreshSeasonalEventState() {
    const cycleKey = getSeasonalEventCycleKey();
    if (this.profile.seasonalEventCycleKey !== cycleKey) {
      this.profile.seasonalEventCycleKey = cycleKey;
      this.profile.seasonalEventProgress = 0;
      this.profile.seasonalEventActivityProgress = {
        waves: 0,
        runs: 0,
        "tower-upgrades": 0,
        "special-kills": 0,
      };
      this.profile.seasonalEventClaims = [];
      return true;
    }
    return false;
  }

  private addSeasonalEventKillProgress(amount = 1) {
    this.refreshSeasonalEventState();
    this.profile.seasonalEventProgress += Math.max(0, amount);
  }

  private addSeasonalEventActivity(activity: Exclude<SeasonalActivity, "kills" | "waves">, amount = 1) {
    this.refreshSeasonalEventState();
    this.profile.seasonalEventActivityProgress ??= {
      waves: 0,
      runs: 0,
      "tower-upgrades": 0,
      "special-kills": 0,
    };
    this.profile.seasonalEventActivityProgress[activity] =
      (this.profile.seasonalEventActivityProgress[activity] ?? 0) + Math.max(0, amount);
  }

  private recordSeasonalEventWave(wave: number) {
    this.refreshSeasonalEventState();
    this.profile.seasonalEventActivityProgress ??= {
      waves: 0,
      runs: 0,
      "tower-upgrades": 0,
      "special-kills": 0,
    };
    this.profile.seasonalEventActivityProgress.waves = Math.max(
      this.profile.seasonalEventActivityProgress.waves,
      Math.max(0, Math.floor(wave)),
    );
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable — progression stays in memory this session */
    }
    this.unsavedCombatKills = 0;
    this.notify();
  }

  refreshRetentionState(now = new Date()) {
    const stamp = dateKey(now);
    const dailyChanged = ensureDailyMissionState(this.profile, stamp);
    const achievementChanged = syncAchievements(this.profile, stamp);
    const changed = dailyChanged || achievementChanged;
    if (changed) this.save();
  }

  private awardXp(amount: number) {
    const p = this.profile;
    p.xp += amount;
    let levelsGained = 0;
    while (p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level += 1;
      p.gems += 1;
      levelsGained += 1;
    }
    if (levelsGained > 0) {
      this.levelUpNoticeId += 1;
      this.levelUpNotice = { id: this.levelUpNoticeId, level: p.level };
    }
    return { leveledTo: levelsGained > 0 ? p.level : null, levelsGained };
  }

  private awardReward(reward: RewardGrant) {
    const p = this.profile;
    if (reward.coins) p.coins += reward.coins;
    if (reward.gems) p.gems += reward.gems;
    return reward.xp ? this.awardXp(reward.xp) : { leveledTo: null, levelsGained: 0 };
  }

  private updateDailyMission(event: DailyMissionEvent, amount: number) {
    const p = this.profile;
    const stamp = dateKey();
    ensureDailyMissionState(p, stamp);
    for (const mission of DAILY_MISSION_DEFS) {
      if (mission.event !== event) continue;
      const current = p.dailyMissionProgress[mission.id] ?? blankProgress(mission.target);
      const progress =
        mission.mode === "max"
          ? Math.min(mission.target, Math.max(current.progress, amount))
          : Math.min(mission.target, current.progress + amount);
      p.dailyMissionProgress[mission.id] = {
        ...current,
        progress,
        target: mission.target,
        completed: progress >= mission.target,
        updatedAt: stamp,
        completedAt: progress >= mission.target ? (current.completedAt ?? stamp) : null,
      };
    }
  }

  private syncAchievementProgress() {
    syncAchievements(this.profile, dateKey());
  }

  unlockedCosmetics() {
    return TOWER_COSMETICS.filter((cosmetic) => cosmetic.unlock(this.profile));
  }

  equipTowerCosmetic(kind: string, cosmeticId: string) {
    const cosmetic = TOWER_COSMETICS.find(
      (entry) =>
        entry.id === cosmeticId &&
        (entry.kind === "all" || entry.towerKind === kind) &&
        entry.unlock(this.profile),
    );
    if (!cosmetic) return false;
    this.profile.equippedTowerCosmetics[kind] = cosmetic.id;
    this.save();
    return true;
  }

  equippedTowerCosmetic(kind: string) {
    return this.profile.equippedTowerCosmetics[kind] ?? "default";
  }


  equippedZombieCosmetic() {
    return this.profile.equippedZombieCosmetic;
  }

  equipZombieCosmetic(cosmeticId: string) {
    const cosmetic = ZOMBIE_COSMETICS.find(
      (entry) => entry.id === cosmeticId && entry.unlock(this.profile),
    );
    if (!cosmetic) return false;
    this.profile.equippedZombieCosmetic = cosmetic.id;
    this.save();
    return true;
  }

  recordZombieKill(kind: number) {
    this.addSeasonalEventKillProgress();
    if (kind >= 2) this.addSeasonalEventActivity("special-kills");
    this.refreshRetentionState();
    const p = this.profile;
    const xp = progressionXpForKill(kind);
    const coins =
      kind === 2 ? 3 : kind === 1 ? 2 : kind === 4 ? 4 : kind === 5 ? 3 : kind === 6 ? 4 : kind === 3 ? 2 : 1;
    p.totalKills += 1;
    if (kind === 2) p.bruteKills += 1;
    p.coins += coins;
    const result = this.awardXp(xp);
    this.updateDailyMission("zombieKill", 1);
    this.syncAchievementProgress();

    // Persist combat progression in batches instead of on every kill. This keeps
    // synchronous JSON serialization/storage work out of the hottest gameplay path.
    this.unsavedCombatKills += 1;
    if (this.unsavedCombatKills >= 24) {
      this.save();
    }

    return { xp, coins, ...result };
  }

  completeBossTrial(
    wave: number,
    kills: number,
    score: number,
    weekKey: string,
    completed: boolean,
    rewardMultiplier = 1,
    trialId?: string,
  ): RunReward & { score: number; bestScore: number } {
    this.addSeasonalEventActivity("runs");
    this.refreshRetentionState();
    const p = this.profile;
    this.lastBossTrialId = trialId ?? null;
    if (p.bossTrialWeekKey !== weekKey) {
      p.bossTrialWeekKey = weekKey;
      p.bossTrialBestScore = 0;
    }

    const normalizedWave = Math.max(1, Math.floor(wave));
    const normalizedScore = Math.max(0, Math.floor(score));
    const newRecord = normalizedScore > p.bossTrialBestScore;
    const rewardScale = Math.max(1, rewardMultiplier);
    const baseXp = Math.round(progressionXpForRun(normalizedWave, kills, rewardScale) * (completed ? 1.15 : 0.8));
    const baseCoins = Math.round((55 + normalizedWave * 8 + Math.floor(kills / 3)) * rewardScale * (completed ? 1.2 : 0.8));
    const gems = completed ? 4 : Math.floor(normalizedWave / 4);

    p.coins += baseCoins;
    p.gems += gems;
    p.gamesPlayed += 1;
    if (newRecord) p.bossTrialBestScore = normalizedScore;
    if (completed && this.lastBossTrialId) {
      const clears = (p.bossTrialClears[this.lastBossTrialId] ?? 0) + 1;
      p.bossTrialClears[this.lastBossTrialId] = clears;
      p.bossTrialMastery[this.lastBossTrialId] = clears >= 10 ? 3 : clears >= 3 ? 2 : 1;
    }

    const result = this.awardXp(baseXp);
    this.updateDailyMission("gameCompleted", 1);
    this.syncAchievementProgress();

    const reward: RunReward & { score: number; bestScore: number } = {
      wave: normalizedWave,
      kills: Math.max(0, kills),
      xp: baseXp,
      coins: baseCoins,
      gems: gems + result.levelsGained,
      leveledTo: result.leveledTo,
      newRecord,
      stageId: null,
      stageCompleted: completed,
      starsEarned: 0,
      firstCompletionBonusApplied: false,
      bestStars: 0,
      previousBestWave: 0,
      previousBestStars: 0,
      score: normalizedScore,
      bestScore: p.bossTrialBestScore,
    };
    this.lastReward = reward;
    this.save();
    return reward;
  }

  completeSideModeRun(
    levelId: string,
    wave: number,
    kills: number,
    score: number,
    reward: { coins: number; xp: number; gems?: number },
    firstClearBonus?: { coins?: number; xp?: number; gems?: number },
    completed = true,
  ): RunReward & { score: number; bestScore: number; clears: number; firstClear: boolean } {
    this.addSeasonalEventActivity("runs");
    this.refreshRetentionState();
    const p = this.profile;
    const normalizedWave = Math.max(1, Math.floor(wave));
    const normalizedScore = Math.max(0, Math.floor(score));
    const previousBest = p.sideModeBestScores[levelId] ?? 0;
    const firstClear = completed && (p.sideModeClears[levelId] ?? 0) === 0;
    const clears = p.sideModeClears[levelId] ?? 0;
    const completionScale = completed ? 1 : 0.35;
    const clearReward = {
      coins: Math.max(0, Math.floor(reward.coins * completionScale)),
      xp: Math.max(0, Math.floor(reward.xp * completionScale)),
      gems: completed ? Math.max(0, Math.floor(reward.gems ?? 0)) : 0,
    };
    const bonus = firstClear ? {
      coins: Math.max(0, Math.floor(firstClearBonus?.coins ?? 0)),
      xp: Math.max(0, Math.floor(firstClearBonus?.xp ?? 0)),
      gems: Math.max(0, Math.floor(firstClearBonus?.gems ?? 0)),
    } : { coins: 0, xp: 0, gems: 0 };
    const coins = clearReward.coins + bonus.coins;
    const gems = clearReward.gems + bonus.gems;
    const xp = clearReward.xp + bonus.xp;
    p.coins += coins;
    p.gems += gems;
    p.gamesPlayed += 1;
    p.sideModeBestScores[levelId] = Math.max(previousBest, normalizedScore);
    if (completed) p.sideModeClears[levelId] = (p.sideModeClears[levelId] ?? 0) + 1;
    const result = this.awardXp(xp);
    this.updateDailyMission("gameCompleted", 1);
    this.syncAchievementProgress();
    const rewardResult: RunReward & { score: number; bestScore: number; clears: number; firstClear: boolean } = {
      wave: normalizedWave,
      kills: Math.max(0, kills),
      xp,
      coins,
      gems: gems + result.levelsGained,
      leveledTo: result.leveledTo,
      newRecord: normalizedScore > previousBest,
      stageId: null,
      stageCompleted: completed,
      starsEarned: firstClear ? 1 : 0,
      firstCompletionBonusApplied: firstClear,
      bestStars: completed ? 1 : 0,
      previousBestWave: 0,
      previousBestStars: 0,
      score: normalizedScore,
      bestScore: p.sideModeBestScores[levelId],
      clears,
      firstClear,
    };
    this.lastReward = rewardResult;
    this.save();
    return rewardResult;
  }

  completeEndlessRun(
    wave: number,
    kills: number,
    options?: {
      challengeId?: string;
      challengePeriod?: "free" | "daily" | "weekly";
      challengeKey?: string;
      rewardMultiplier?: number;
    },
  ): RunReward & { score: number; bestWave: number; bestScore: number } {
    this.addSeasonalEventActivity("runs");
    this.refreshRetentionState();
    const p = this.profile;
    const multiplier = Math.max(0.5, options?.rewardMultiplier ?? 1);
    const score = Math.max(0, Math.round(wave * 100 + kills * 8 + p.level * 10));
    const newWaveRecord = wave > p.endlessBestWave;
    const newScoreRecord = score > p.endlessBestScore;
    const baseXp = progressionXpForRun(wave, kills, multiplier);
    const baseCoins = Math.round((15 + wave * 4.5 + Math.floor(kills / 4)) * multiplier);
    const gems = Math.floor(wave / 10) + (newScoreRecord && wave >= 10 ? 2 : 0);

    p.coins += baseCoins;
    p.gems += gems;
    p.gamesPlayed += 1;
    if (newWaveRecord) p.endlessBestWave = wave;
    if (newScoreRecord) p.endlessBestScore = score;

    if (options?.challengePeriod === "daily" && options.challengeKey) {
      if (p.dailyChallengeDate !== options.challengeKey) {
        p.dailyChallengeDate = options.challengeKey;
        p.dailyChallengeBestScore = 0;
      }
      p.dailyChallengeBestScore = Math.max(p.dailyChallengeBestScore, score);
    }
    if (options?.challengePeriod === "weekly" && options.challengeKey) {
      if (p.weeklyChallengeKey !== options.challengeKey) {
        p.weeklyChallengeKey = options.challengeKey;
        p.weeklyChallengeBestScore = 0;
      }
      p.weeklyChallengeBestScore = Math.max(p.weeklyChallengeBestScore, score);
    }

    const result = this.awardXp(baseXp);
    this.updateDailyMission("gameCompleted", 1);
    this.syncAchievementProgress();
    const reward: RunReward & { score: number; bestWave: number; bestScore: number } = {
      wave,
      kills,
      xp: baseXp,
      coins: baseCoins,
      gems: gems + result.levelsGained,
      leveledTo: result.leveledTo,
      newRecord: newWaveRecord || newScoreRecord,
      stageId: null,
      stageCompleted: false,
      starsEarned: 0,
      firstCompletionBonusApplied: false,
      bestStars: 0,
      previousBestWave: Math.max(0, p.endlessBestWave - (newWaveRecord ? 1 : 0)),
      previousBestStars: 0,
      score,
      bestWave: p.endlessBestWave,
      bestScore: p.endlessBestScore,
    };
    this.lastReward = reward;
    this.save();
    return reward;
  }

  recordWaveReached(wave: number) {
    this.recordSeasonalEventWave(wave);
    this.refreshRetentionState();
    const coins = 5 + wave * 2;
    const xp = progressionXpForWave(wave);
    const p = this.profile;
    p.coins += coins;
    const result = this.awardXp(xp);
    this.updateDailyMission("waveReached", wave);
    this.syncAchievementProgress();
    this.save();
    return { xp, coins, ...result };
  }

  private stageEntry(stageId: number): StageProgress {
    const key = String(stageId);
    const existing = this.profile.stageProgress[key];
    if (existing) return existing;
    const created = blankStageProgress(stageId === 1);
    this.profile.stageProgress[key] = created;
    return created;
  }

  /** Called when a run ends (win or loss). Awards completion XP, coins and gems. */
  completeRun(
    wave: number,
    kills: number,
    options?: {
      stageId?: number;
      stageCompleted?: boolean;
      starsEarned?: number;
      bonusCoins?: number;
      bonusXp?: number;
      bonusStars?: number;
      firstCompletionBonus?: {
        coins: number;
        xp: number;
        stars: number;
      };
      rewardMultiplier?: number;
    },
  ): RunReward {
    this.addSeasonalEventActivity("runs");
    this.refreshRetentionState();
    const p = this.profile;
    const stageCompleted = Boolean(options?.stageCompleted);
    const stageId = options?.stageId ?? null;
    const rewardMultiplier = Math.max(0.1, options?.rewardMultiplier ?? 1);
    const baseXp = progressionXpForRun(wave, kills, rewardMultiplier);
    const baseCoins = Math.round((12 + wave * 4 + Math.floor(kills / 4)) * rewardMultiplier);
    const completionXp = stageCompleted ? Math.max(0, options?.bonusXp ?? 0) : 0;
    const completionCoins = stageCompleted ? Math.max(0, options?.bonusCoins ?? 0) : 0;
    const completionStars = stageCompleted ? Math.max(0, options?.bonusStars ?? 0) : 0;
    let bonusXp = completionXp;
    let bonusCoins = completionCoins;
    let bonusStars = completionStars;
    let firstCompletionBonusApplied = false;
    const newRecord = wave > p.highestWave;
    const gems = Math.floor(wave / 7) + (newRecord && wave >= 3 ? 1 : 0);
    let previousBestWave = 0;
    let previousBestStars = 0;
    let bestStars = 0;

    if (stageId !== null) {
      const progress = this.stageEntry(stageId);
      previousBestWave = progress.bestWave;
      previousBestStars = progress.stars;
      if (stageCompleted && !progress.completed) {
        const firstBonus = options?.firstCompletionBonus;
        if (firstBonus) {
          bonusCoins += Math.max(0, firstBonus.coins);
          bonusXp += Math.max(0, firstBonus.xp);
          bonusStars += Math.max(0, firstBonus.stars);
          firstCompletionBonusApplied = true;
        }
      }
      const rawStars = options?.starsEarned ?? 0;
      const starsEarned = stageCompleted ? Math.min(3, Math.max(1, rawStars + bonusStars)) : 0;
      if (wave > progress.bestWave) progress.bestWave = wave;
      if (stageCompleted) {
        progress.completed = true;
        progress.stars = Math.max(progress.stars, starsEarned);
        const nextStageId = getNextStageId(stageId);
        if (nextStageId !== null) {
          this.stageEntry(nextStageId).unlocked = true;
        }
      }
      bestStars = progress.stars;
      p.coins += baseCoins + bonusCoins;
      p.gems += gems;
      p.gamesPlayed += 1;
      if (wave > p.highestWave) p.highestWave = wave;

      const result = this.awardXp(baseXp + bonusXp);
      this.updateDailyMission("gameCompleted", 1);
      this.syncAchievementProgress();
      const reward: RunReward = {
        wave,
        kills,
        xp: baseXp + bonusXp,
        coins: baseCoins + bonusCoins,
        gems: gems + result.levelsGained,
        leveledTo: result.leveledTo,
        newRecord,
        stageId,
        stageCompleted,
        starsEarned,
        firstCompletionBonusApplied,
        bestStars,
        previousBestWave,
        previousBestStars,
      };
      this.lastReward = reward;
      this.save();
      return reward;
    }

    const rawStars = options?.starsEarned ?? 0;
    const starsEarned = stageCompleted ? Math.min(3, Math.max(1, rawStars + bonusStars)) : 0;
    p.coins += baseCoins + bonusCoins;
    p.gems += gems;
    p.gamesPlayed += 1;
    if (wave > p.highestWave) p.highestWave = wave;

    const result = this.awardXp(baseXp + bonusXp);
    this.updateDailyMission("gameCompleted", 1);
    this.syncAchievementProgress();
    const reward: RunReward = {
      wave,
      kills,
      xp: baseXp + bonusXp,
      coins: baseCoins + bonusCoins,
      gems: gems + result.levelsGained,
      leveledTo: result.leveledTo,
      newRecord,
      stageId,
      stageCompleted,
      starsEarned,
      firstCompletionBonusApplied,
      bestStars,
      previousBestWave,
      previousBestStars,
    };
    this.lastReward = reward;
    this.save();
    return reward;
  }

  recordTowerBuilt(kind: string) {
    this.refreshRetentionState();
    const p = this.profile;
    if (!p.builtTowerKinds.includes(kind)) {
      p.builtTowerKinds.push(kind);
      this.syncAchievementProgress();
      this.save();
    }
  }

  /** Track in-run upgrade activity separately from permanent upgrade levels. */
  recordTowerUpgrade(kind: string, points = 1) {
    this.refreshRetentionState();
    const p = this.profile;
    const earned = Math.max(0, points);
    this.addSeasonalEventActivity("tower-upgrades", earned);
    p.towerUpgradeActions += earned;
    p.towerMasteryXp ??= {};
    p.towerMasteryXp[kind] = (p.towerMasteryXp[kind] ?? 0) + earned * 25;
    this.syncAchievementProgress();
    this.save();
  }

  /** Kills made by each tower kind earn mastery XP (1 per kill, 10 per boss), flushed once per wave. */
  recordTowerKills(kills: Record<string, number>) {
    const p = this.profile;
    p.towerMasteryXp ??= {};
    let changed = false;
    for (const [kind, count] of Object.entries(kills)) {
      const earned = Math.max(0, Math.floor(count));
      if (earned <= 0) continue;
      p.towerMasteryXp[kind] = (p.towerMasteryXp[kind] ?? 0) + earned;
      changed = true;
    }
    if (changed) this.save();
  }

  towerMasteryLevel(kind: string) {
    return Math.min(10, Math.floor(((this.profile.towerMasteryXp ?? {})[kind] ?? 0) / 100));
  }

  towerMasteryProgress(kind: string) {
    const xp = (this.profile.towerMasteryXp ?? {})[kind] ?? 0;
    const level = this.towerMasteryLevel(kind);
    return {
      xp,
      level,
      current: xp - level * 100,
      target: level >= 10 ? 0 : 100,
    };
  }

  unlockTower(kind: string, cost: number) {
    const p = this.profile;
    if (p.unlockedTowers.includes(kind)) return true;
    if (p.coins < cost) return false;
    p.coins -= cost;
    p.unlockedTowers.push(kind);
    this.save();
    return true;
  }

  claimSeasonalMilestone(id: string) {
    this.refreshRetentionState();
    const event = getSeasonalEvent();
    this.refreshSeasonalEventState();
    const milestone = event.milestones.find((entry) => entry.id === id);
    if (!milestone || this.profile.seasonalEventClaims.includes(id)) return false;
    if (
      milestone.prerequisite &&
      !this.profile.seasonalEventClaims.includes(milestone.prerequisite)
    ) {
      return false;
    }
    if (
      getSeasonalMilestoneProgress(
        milestone,
        this.profile.seasonalEventProgress,
        this.profile.seasonalEventActivityProgress,
      ) < milestone.target
    ) {
      return false;
    }
    this.profile.seasonalEventClaims.push(id);
    this.profile.seasonalEventUnlocks ??= [];
    if (milestone.cosmeticId && !this.profile.seasonalEventUnlocks.includes(milestone.cosmeticId)) {
      this.profile.seasonalEventUnlocks.push(milestone.cosmeticId);
    }
    if (milestone.reward.coins) this.profile.coins += milestone.reward.coins;
    if (milestone.reward.gems) this.profile.gems += milestone.reward.gems;
    if (milestone.reward.xp) this.awardXp(milestone.reward.xp);
    this.save();
    return true;
  }

  claimDailyMission(id: string) {
    this.refreshRetentionState();
    const mission = DAILY_MISSION_DEFS.find((entry) => entry.id === id);
    if (!mission) return false;
    const progress = this.profile.dailyMissionProgress[id] ?? blankProgress(mission.target);
    if (!progress.completed || progress.claimed) return false;
    progress.claimed = true;
    progress.claimedAt = dateKey();
    this.profile.dailyMissionProgress[id] = progress;
    this.awardReward(mission.reward);
    this.save();
    return true;
  }

  claimAchievement(id: string) {
    this.refreshRetentionState();
    const achievement = ACHIEVEMENT_DEFS.find((entry) => entry.id === id);
    if (!achievement) return false;
    const progress = this.profile.achievements[id] ?? blankProgress(achievement.target);
    if (!progress.completed || progress.claimed) return false;
    progress.claimed = true;
    progress.claimedAt = dateKey();
    this.profile.achievements[id] = progress;
    this.awardReward(achievement.reward);
    this.save();
    return true;
  }

  claimDailyLoginReward() {
    const p = this.profile;
    const today = dateKey();
    if (p.lastLoginClaimDate === today) return false;
    const reward = DAILY_LOGIN_REWARDS.find((entry) => entry.day === p.loginCycleDay);
    if (!reward) return false;
    const claimedDay = p.loginCycleDay;
    this.awardReward(reward.reward);
    p.lastLoginClaimDate = today;
    p.lastLoginRewardDayClaimed = claimedDay;
    p.loginCycleDay = claimedDay >= DAILY_LOGIN_REWARDS.length ? 1 : claimedDay + 1;
    this.save();
    return true;
  }

  get canClaimDailyRewardedBonus() {
    return this.profile.dailyRewardedBonusDate !== dateKey();
  }

  claimDailyRewardedBonus(): boolean {
    const today = dateKey();
    if (this.profile.dailyRewardedBonusDate === today) return false;
    this.profile.coins += 150;
    this.profile.gems += 1;
    this.profile.dailyRewardedBonusDate = today;
    this.save();
    return true;
  }

  claimLastRunRewardBoost(): boolean {
    const reward = this.lastReward;
    if (!reward || this.lastRunRewardBoosted) return false;

    this.profile.coins += reward.coins;
    this.awardXp(reward.xp);
    this.lastReward = { ...reward, coins: reward.coins * 2, xp: reward.xp * 2 };
    this.lastRunRewardBoosted = true;
    this.save();
    return true;
  }

  setAdsRemoved(value: boolean) {
    this.profile.adsRemoved = value;
    this.save();
  }

  setReducedMotion(value: boolean) {
    this.profile.reducedMotion = value;
    this.save();
  }

  clearReward() {
    this.lastReward = null;
    this.lastRunRewardBoosted = false;
    this.notify();
  }
}

export const profile = new ProfileStore();
