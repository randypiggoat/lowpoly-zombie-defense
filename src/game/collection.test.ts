import { describe, expect, test } from "bun:test";
import { TOWER_COSMETICS, cosmeticForTower } from "./collection";
import type { PlayerProfile } from "./profile";

function profile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    version: 4,
    xp: 0,
    level: 1,
    coins: 0,
    gems: 0,
    highestWave: 25,
    totalKills: 100,
    bruteKills: 0,
    gamesPlayed: 0,
    towerUpgradeActions: 0,
    builtTowerKinds: [],
    dailyMissionDate: "2026-09-27",
    loginCycleDay: 1,
    lastLoginClaimDate: null,
    lastLoginRewardDayClaimed: null,
    towerUpgrades: {},
    fieldKnowledge: {},
    unlockedTowers: [],
    achievements: {},
    dailyMissionProgress: {},
    stageProgress: { "3": { unlocked: true, completed: true, bestWave: 8, stars: 3 } },
    endlessBestWave: 0,
    endlessBestScore: 0,
    dailyChallengeDate: "2026-09-27",
    dailyChallengeBestScore: 0,
    weeklyChallengeKey: null,
    weeklyChallengeBestScore: 0,
    bossTrialWeekKey: null,
    bossTrialBestScore: 0,
    equippedTowerCosmetics: {},
    seasonalEventCycleKey: "E0",
    seasonalEventProgress: 100,
    seasonalEventActivityProgress: {
      waves: 0,
      runs: 0,
      "tower-upgrades": 0,
      "special-kills": 0,
    },
    seasonalEventClaims: [],
    seasonalEventUnlocks: [],
    ...overrides,
  };
}

describe("tower collection", () => {
  test("unlocks cosmetics from existing progression goals", () => {
    const p = profile();
    expect(TOWER_COSMETICS.find((c) => c.id === "bloodmoon-rifle")!.unlock(p)).toBe(true);
    expect(TOWER_COSMETICS.find((c) => c.id === "ember-rocket")!.unlock(p)).toBe(false);
  });

  test("unlocks the seasonal cosmetic through the collection", () => {
    const locked = profile();
    const unlocked = profile({ seasonalEventUnlocks: ["seasonal-vanguard"] });
    const cosmetic = TOWER_COSMETICS.find((entry) => entry.id === "seasonal-vanguard")!;

    expect(cosmetic.unlock(locked)).toBe(false);
    expect(cosmetic.unlock(unlocked)).toBe(true);
    expect(cosmetic.towerKind).toBe("freezer");
  });

  test("equips a cosmetic only on the matching tower", () => {
    const skin = cosmeticForTower("rifleman", "bloodmoon-rifle");
    expect(skin?.name).toBe("Blood Moon");
    expect(cosmeticForTower("shotgunner", "bloodmoon-rifle")).toBeNull();
  });
});
