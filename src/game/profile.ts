// Persistent player progression. Stored client-side in localStorage.

const KEY = "rotwood.profile.v1";
const PROFILE_VERSION = 2;
const MAX_TOWER_UPGRADE_LEVEL = 5;

export type TowerUpgradeProfile = {
  level: number;
  points: number;
  spentCoins: number;
};

export type AchievementProgress = {
  progress: number;
  completed: boolean;
  completedAt: string | null;
};

export type DailyMissionProgress = {
  progress: number;
  target: number;
  completed: boolean;
  updatedAt: string | null;
};

export type PlayerProfile = {
  version: number;
  xp: number;
  level: number;
  coins: number;
  gems: number;
  highestWave: number;
  totalKills: number;
  gamesPlayed: number;
  /** Persistent per-tower-kind upgrade data, expandable later. */
  towerUpgrades: Record<string, TowerUpgradeProfile>;
  /** Tower kinds unlocked ahead of their level gate. */
  unlockedTowers: string[];
  /** Reserved for future milestone tracking. */
  achievements: Record<string, AchievementProgress>;
  /** Reserved for future daily mission syncing. */
  dailyMissionProgress: Record<string, DailyMissionProgress>;
};

export type RunReward = {
  wave: number;
  kills: number;
  xp: number;
  coins: number;
  gems: number;
  leveledTo: number | null;
  newRecord: boolean;
};

export type LevelUpNotice = {
  id: number;
  level: number;
};

function blank(): PlayerProfile {
  return {
    version: PROFILE_VERSION,
    xp: 0,
    level: 1,
    coins: 0,
    gems: 0,
    highestWave: 0,
    totalKills: 0,
    gamesPlayed: 0,
    towerUpgrades: {},
    unlockedTowers: [],
    achievements: {},
    dailyMissionProgress: {},
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

function normalizeRecord<T>(value: unknown): Record<string, T> {
  return isRecord(value) ? (value as Record<string, T>) : {};
}

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.18, Math.max(0, level - 1)));
}

/** XP accumulated inside the current level. */
export function xpIntoLevel(p: PlayerProfile): number {
  return p.xp;
}

function load(): PlayerProfile {
  if (typeof localStorage === "undefined") return blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      ...blank(),
      ...parsed,
      version: PROFILE_VERSION,
      towerUpgrades: normalizeTowerUpgrades(parsed.towerUpgrades),
      unlockedTowers: normalizeStringArray(parsed.unlockedTowers),
      achievements: normalizeRecord<AchievementProgress>(parsed.achievements),
      dailyMissionProgress: normalizeRecord<DailyMissionProgress>(parsed.dailyMissionProgress),
    };
  } catch {
    return blank();
  }
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

  recordZombieKill(kind: 0 | 1 | 2) {
    const p = this.profile;
    const xp = kind === 2 ? 5 : kind === 1 ? 3 : 2;
    const coins = kind === 2 ? 3 : kind === 1 ? 2 : 1;
    p.totalKills += 1;
    p.coins += coins;
    const result = this.awardXp(xp);
    this.save();
    return { xp, coins, ...result };
  }

  recordWaveReached(wave: number) {
    const coins = 5 + wave * 2;
    const xp = 10 + wave * 4;
    const p = this.profile;
    p.coins += coins;
    const result = this.awardXp(xp);
    this.save();
    return { xp, coins, ...result };
  }

  /** Called when a run ends (win or loss). Awards completion XP, coins and gems. */
  completeRun(wave: number, kills: number): RunReward {
    const p = this.profile;
    const xp = 20 + wave * 10 + Math.floor(kills / 2);
    const coins = 12 + wave * 4 + Math.floor(kills / 4);
    const newRecord = wave > p.highestWave;
    const gems = Math.floor(wave / 7) + (newRecord && wave >= 3 ? 1 : 0);

    p.coins += coins;
    p.gems += gems;
    p.gamesPlayed += 1;
    if (newRecord) p.highestWave = wave;

    const result = this.awardXp(xp);
    const reward: RunReward = {
      wave,
      kills,
      xp,
      coins,
      gems: gems + result.levelsGained,
      leveledTo: result.leveledTo,
      newRecord,
    };
    this.lastReward = reward;
    this.save();
    return reward;
  }

  /** Track in-run upgrade activity separately from permanent upgrade levels. */
  recordTowerUpgrade(kind: string, points = 1) {
    const entry = this.towerUpgrade(kind);
    entry.points += points;
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

  clearReward() {
    this.lastReward = null;
    this.notify();
  }
}

export const profile = new ProfileStore();
