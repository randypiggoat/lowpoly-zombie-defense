// Persistent player progression. Stored client-side in localStorage.

const KEY = "rotwood.profile.v1";

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
  towerUpgrades: Record<string, { level: number; points: number }>;
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

function blank(): PlayerProfile {
  return {
    version: 1,
    xp: 0,
    level: 1,
    coins: 0,
    gems: 0,
    highestWave: 0,
    totalKills: 0,
    gamesPlayed: 0,
    towerUpgrades: {},
  };
}

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 75;
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
    return { ...blank(), ...parsed, towerUpgrades: parsed.towerUpgrades ?? {} };
  } catch {
    return blank();
  }
}

class ProfileStore {
  private data: PlayerProfile = blank();
  private loaded = false;
  private listeners = new Set<() => void>();
  lastReward: RunReward | null = null;

  get profile(): PlayerProfile {
    if (!this.loaded && typeof localStorage !== "undefined") {
      this.data = load();
      this.loaded = true;
    }
    return this.data;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable — progression stays in memory this session */
    }
    this.listeners.forEach((l) => l());
  }

  /** Called when a run ends (win or loss). Awards XP, coins and gems. */
  completeRun(wave: number, kills: number): RunReward {
    const p = this.profile;
    const xp = 40 + wave * 25 + kills * 3;
    const coins = 25 + wave * 12 + kills * 2;
    const gems = Math.floor(wave / 5);

    const startLevel = p.level;
    p.xp += xp;
    p.coins += coins;
    p.gems += gems;
    p.totalKills += kills;
    p.gamesPlayed += 1;
    const newRecord = wave > p.highestWave;
    if (newRecord) p.highestWave = wave;

    while (p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level += 1;
      p.gems += 1;
    }

    const reward: RunReward = {
      wave,
      kills,
      xp,
      coins,
      gems: gems + Math.max(0, p.level - startLevel),
      leveledTo: p.level > startLevel ? p.level : null,
      newRecord,
    };
    this.lastReward = reward;
    this.save();
    return reward;
  }

  /** Persist tower upgrade progress across runs. */
  recordTowerUpgrade(kind: string, points = 1) {
    const p = this.profile;
    const entry = p.towerUpgrades[kind] ?? { level: 1, points: 0 };
    entry.points += points;
    entry.level = 1 + Math.floor(entry.points / 10);
    p.towerUpgrades[kind] = entry;
    this.save();
  }

  clearReward() {
    this.lastReward = null;
    this.listeners.forEach((l) => l());
  }
}

export const profile = new ProfileStore();
