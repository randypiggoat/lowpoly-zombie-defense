import { afterEach, describe, expect, test } from "bun:test";
import { profile } from "./profile";
import { getSeasonalEvent, getSeasonalEventCycleKey } from "./liveOps";
import { TOWER_COSMETICS } from "./collection";

describe("profile contract", () => {
  test("defaults ad removal to off for new players", () => {
    expect(profile.profile.adsRemoved).toBe(false);
  });
});

describe("accessibility preferences", () => {
  const original = profile.profile.reducedMotion;

  afterEach(() => {
    profile.profile.reducedMotion = original;
  });

  test("reduced motion defaults off for the baseline profile", () => {
    expect(typeof profile.profile.reducedMotion).toBe("boolean");
  });

  test("reduced motion can be toggled and persisted through the profile API", () => {
    profile.setReducedMotion(true);
    expect(profile.profile.reducedMotion).toBe(true);
    profile.setReducedMotion(false);
    expect(profile.profile.reducedMotion).toBe(false);
  });
});


describe("daily login rewards", () => {
  test("claims the current seven-day reward once", () => {
    const originalCoins = profile.profile.coins;
    const originalGems = profile.profile.gems;
    const originalXp = profile.profile.xp;
    const originalLevel = profile.profile.level;
    const originalClaimDate = profile.profile.lastLoginClaimDate;
    const originalClaimedDay = profile.profile.lastLoginRewardDayClaimed;
    const originalCycleDay = profile.profile.loginCycleDay;

    profile.profile.coins = originalCoins;
    profile.profile.lastLoginClaimDate = null;
    profile.profile.lastLoginRewardDayClaimed = null;
    profile.profile.loginCycleDay = 1;

    try {
      expect(profile.claimDailyLoginReward()).toBe(true);
      expect(profile.profile.coins).toBe(originalCoins + 120);
      expect(profile.claimDailyLoginReward()).toBe(false);
    } finally {
      profile.profile.coins = originalCoins;
      profile.profile.gems = originalGems;
      profile.profile.xp = originalXp;
      profile.profile.level = originalLevel;
      profile.profile.lastLoginClaimDate = originalClaimDate;
      profile.profile.lastLoginRewardDayClaimed = originalClaimedDay;
      profile.profile.loginCycleDay = originalCycleDay;
    }
  });

  describe("seasonal event progression", () => {
    test("tracks waves, tower upgrades, and special kills as event activities", () => {
      const originalProfile = structuredClone(profile.profile);
      const originalReward = profile.lastReward;

      try {
        profile.profile.seasonalEventCycleKey = getSeasonalEventCycleKey();
        profile.profile.seasonalEventActivityProgress = {
          waves: 0,
          runs: 0,
          "tower-upgrades": 0,
          "special-kills": 0,
        };
        profile.recordWaveReached(6);
        profile.recordTowerUpgrade("rifleman", 2);
        profile.recordZombieKill(2);

        expect(profile.profile.seasonalEventActivityProgress.waves).toBe(6);
        expect(profile.profile.seasonalEventActivityProgress["tower-upgrades"]).toBe(2);
        expect(profile.profile.seasonalEventActivityProgress["special-kills"]).toBe(1);
      } finally {
        Object.assign(profile.profile, originalProfile);
        profile.lastReward = originalReward;
      }
    });

    test("gates the finale and permanently unlocks its collection cosmetic", () => {
      const player = profile.profile;
      const original = {
        cycleKey: player.seasonalEventCycleKey,
        killProgress: player.seasonalEventProgress,
        activityProgress: { ...player.seasonalEventActivityProgress },
        claims: [...player.seasonalEventClaims],
        unlocks: [...player.seasonalEventUnlocks],
      };
      const event = getSeasonalEvent();
      const finale = event.milestones[event.milestones.length - 1]!;

      try {
        player.seasonalEventCycleKey = getSeasonalEventCycleKey();
        player.seasonalEventProgress = 0;
        player.seasonalEventActivityProgress = {
          waves: 12,
          runs: 5,
          "tower-upgrades": 3,
          "special-kills": 40,
        };
        player.seasonalEventClaims = [];
        player.seasonalEventUnlocks = [];

        expect(profile.claimSeasonalMilestone(finale.id)).toBe(false);
        player.seasonalEventClaims.push(...event.milestones.slice(0, -1).map((milestone) => milestone.id));
        expect(profile.claimSeasonalMilestone(finale.id)).toBe(true);
        expect(TOWER_COSMETICS.find((entry) => entry.id === finale.cosmeticId)?.unlock(player)).toBe(true);
      } finally {
        player.seasonalEventCycleKey = original.cycleKey;
        player.seasonalEventProgress = original.killProgress;
        player.seasonalEventActivityProgress = original.activityProgress;
        player.seasonalEventClaims = original.claims;
        player.seasonalEventUnlocks = original.unlocks;
      }
    });
  });
});
