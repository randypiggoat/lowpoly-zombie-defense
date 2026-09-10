// Persistent player progression. Stored client-side in localStorage.
import { STAGE_DEFS, getNextStageId } from "./navigation";

const KEY = "rotwood.profile.v1";
const PROFILE_VERSION = 3;
const MAX_TOWER_UPGRADE_LEVEL = 5;
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
    reward: { label: "150 coins", coins: 150 },
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
    reward: { label: "180 XP", xp: 180 },
  },
];

export const ACHIEVEMENT_DEFS: AchievementDefinition[] = [
  {
    id: "first-blood",
    title: "First Blood",
    description: "Kill your first zombie.",
    target: 1,
    metric: "totalKills",
    reward: { label: "50 coins", coins: 50 },
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
    reward: { label: "150 coins", coins: 150 },
  },
  {
    id: "wave-25",
    title: "Reach Wave 25",
    description: "Reach Wave 25 in any run.",
    target: 25,
    metric: "highestWave",
    reward: { label: "250 XP", xp: 250 },
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
    reward: { label: "100 coins", coins: 100 },
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
  { day: 1, title: "Coins", reward: { label: "120 coins", coins: 120 } },
  { day: 2, title: "Coins", reward: { label: "180 coins", coins: 180 } },
  { day: 3, title: "Gems", reward: { label: "6 gems", gems: 6 } },
  { day: 4, title: "XP Boost", reward: { label: "220 XP", xp: 220 } },
  {
    day: 5,
    title: "Rare Reward",
    reward: { label: "Rare cache · 260 coins + 4 gems", coins: 260, gems: 4 },
  },
  { day: 6, title: "Gems", reward: { label: "10 gems", gems: 10 } },
  {
    day: 7,
    title: "Special Reward",
    reward: {
      label: "Special cache · 400 coins + 12 gems + 320 XP",
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
  /** Persistent per-tower-kind upgrade data, expandable later. */
  towerUpgrades: Record<string, TowerUpgradeProfile>;
  /** Tower kinds unlocked ahead of their level gate. */
  unlockedTowers: string[];
  achievements: Record<string, AchievementProgress>;
  dailyMissionProgress: Record<string, DailyMissionProgress>;
  stageProgress: Record<string, StageProgress>;
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
    towerUpgrades: {},
    unlockedTowers: [],
    achievements: {},
    dailyMissionProgress: blankDailyProgress(today),
    stageProgress: defaultStageProgress(),
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
          level: Math.max(0, Number(entry.level) || 0),
          points: Math.max(0, Number(entry.points) || 0),
          spentCoins: Math.max(0, Number(entry.spentCoins) || 0),
        },
      ];
    }),
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
      const target = Math.max(0, Number(entry.target) || 0);
      const progress = Math.max(0, Number(entry.progress) || 0);
      return [
        id,
        {
          progress,
          target,
          completed: Boolean(entry.completed) || (target > 0 && progress >= target),
          claimed: Boolean(entry.claimed),
          updatedAt: normalizeDate(entry.updatedAt),
          completedAt: normalizeDate(entry.completedAt),
          claimedAt: normalizeDate(entry.claimedAt),
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
          unlocked: Boolean(entry.unlocked),
          completed: Boolean(entry.completed),
          bestWave: Math.max(0, Number(entry.bestWave) || 0),
          stars: Math.min(3, Math.max(0, Number(entry.stars) || 0)),
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
    if (!entry || entry.target !== mission.target) {
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
      claimed: entry.claimed,
      updatedAt: progress !== entry.progress || entry.updatedAt === null ? stamp : entry.updatedAt,
      completedAt: completed ? (entry.completedAt ?? stamp) : null,
      claimedAt: entry.claimedAt ?? null,
    };
    if (
      !profile.achievements[achievement.id] ||
      entry.progress !== next.progress ||
      entry.target !== next.target ||
      entry.completed !== next.completed ||
      entry.claimed !== next.claimed ||
      entry.updatedAt !== next.updatedAt ||
      entry.completedAt !== next.completedAt ||
      entry.claimedAt !== next.claimedAt
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
      unlockedTowers: normalizeStringArray(parsed.unlockedTowers),
      achievements: normalizeClaimProgressRecords(parsed.achievements),
      dailyMissionProgress: normalizeClaimProgressRecords(parsed.dailyMissionProgress),
      stageProgress: normalizeStageProgressRecords(parsed.stageProgress),
    };
    const today = dateKey();
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
  return Math.round(100 * Math.pow(1.18, Math.max(0, level - 1)));
}

/** XP accumulated inside the current level. */
export function xpIntoLevel(p: PlayerProfile): number {
  return p.xp;
}

class ProfileStore {
  private data: PlayerProfile = blank();
  private loaded = false;
  private listeners = new Set<() => void>();
  private revision = 0;
  private levelUpNoticeId = 0;
  lastReward: RunReward | null = null;
  levelUpNotice: LevelUpNotice | null = null;

  get profile(): PlayerProfile {
    if (!this.loaded && typeof localStorage !== "undefined") {
      this.data = load();
      this.loaded = true;
    }
    return this.data;
  }

  get snapshot() {
    void this.profile;
    return this.revision;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.revision += 1;
    this.listeners.forEach((l) => l());
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable — progression stays in memory this session */
    }
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

  private towerUpgrade(kind: string): TowerUpgradeProfile {
    const p = this.profile;
    const existing = p.towerUpgrades[kind];
    if (existing) return existing;
    const created: TowerUpgradeProfile = { level: 0, points: 0, spentCoins: 0 };
    p.towerUpgrades[kind] = created;
    return created;
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

  recordZombieKill(kind: 0 | 1 | 2) {
    this.refreshRetentionState();
    const p = this.profile;
    const xp = kind === 2 ? 5 : kind === 1 ? 3 : 2;
    const coins = kind === 2 ? 3 : kind === 1 ? 2 : 1;
    p.totalKills += 1;
    if (kind === 2) p.bruteKills += 1;
    p.coins += coins;
    const result = this.awardXp(xp);
    this.updateDailyMission("zombieKill", 1);
    this.syncAchievementProgress();
    this.save();
    return { xp, coins, ...result };
  }

  recordWaveReached(wave: number) {
    this.refreshRetentionState();
    const coins = 5 + wave * 2;
    const xp = 10 + wave * 4;
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
    this.refreshRetentionState();
    const p = this.profile;
    const stageCompleted = Boolean(options?.stageCompleted);
    const stageId = options?.stageId ?? null;
    const rewardMultiplier = Math.max(0.1, options?.rewardMultiplier ?? 1);
    const baseXp = Math.round((20 + wave * 10 + Math.floor(kills / 2)) * rewardMultiplier);
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
    const entry = this.towerUpgrade(kind);
    entry.points += points;
    p.towerUpgradeActions += points;
    this.syncAchievementProgress();
    this.save();
  }

  towerUpgradeLevel(kind: string) {
    return this.profile.towerUpgrades[kind]?.level ?? 0;
  }

  towerUpgradeCost(baseCost: number, kind: string) {
    const level = this.towerUpgradeLevel(kind);
    if (level >= MAX_TOWER_UPGRADE_LEVEL) return Infinity;
    return Math.round(baseCost * (1.5 + level * 0.85));
  }

  buyTowerUpgrade(kind: string, cost: number) {
    const p = this.profile;
    const entry = this.towerUpgrade(kind);
    if (entry.level >= MAX_TOWER_UPGRADE_LEVEL || p.coins < cost) return false;
    p.coins -= cost;
    entry.level += 1;
    entry.spentCoins += cost;
    this.save();
    return true;
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

  clearReward() {
    this.lastReward = null;
    this.notify();
  }
}

export const profile = new ProfileStore();
