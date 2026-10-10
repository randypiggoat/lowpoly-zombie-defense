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
          waves: 15,
          runs: 5,
          "tower-upgrades": 8,
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


describe("kill-only run currency and endless XP rules", () => {
  test("endless activity cannot farm XP-bearing seasonal milestones while retaining other progress", () => {
    const originalProfile = structuredClone(profile.profile);
    const originalReward = profile.lastReward;
    const event = getSeasonalEvent();
    const specialKillsAwardXp = event.milestones.some(
      (milestone) => milestone.activity === "special-kills" && (milestone.reward.xp ?? 0) > 0,
    );
    const upgradesAwardXp = event.milestones.some(
      (milestone) => milestone.activity === "tower-upgrades" && (milestone.reward.xp ?? 0) > 0,
    );

    try {
      profile.profile.seasonalEventCycleKey = getSeasonalEventCycleKey();
      profile.profile.seasonalEventProgress = 0;
      profile.profile.seasonalEventActivityProgress = {
        waves: 0,
        runs: 0,
        "tower-upgrades": 0,
        "special-kills": 0,
      };
      profile.profile.towerMasteryXp ??= {};
      const oldTowerMastery = profile.profile.towerMasteryXp["rifleman"] ?? 0;
      const oldXp = profile.profile.xp;

      profile.recordWaveReached(12, { awardXp: false });
      profile.recordZombieKill(2, { awardXp: false });
      profile.recordTowerUpgrade("rifleman", 1, { trackXpBearingSeasonal: false });

      expect(profile.profile.seasonalEventActivityProgress.waves).toBe(0);
      expect(profile.profile.seasonalEventActivityProgress["special-kills"]).toBe(specialKillsAwardXp ? 0 : 1);
      expect(profile.profile.seasonalEventActivityProgress["tower-upgrades"]).toBe(upgradesAwardXp ? 0 : 1);
      expect(profile.profile.towerMasteryXp["rifleman"]).toBe(oldTowerMastery + 25);
      expect(profile.profile.xp).toBe(oldXp);
    } finally {
      Object.assign(profile.profile, originalProfile);
      profile.lastReward = originalReward;
    }
  });


  test("wave milestones no longer mint credits and endless kills can withhold XP", () => {
    const originalProfile = structuredClone(profile.profile), originalReward = profile.lastReward;
    try {
      profile.profile.coins = 321; profile.profile.xp = 17;
      const coinsBeforeWave=profile.profile.coins, xpBeforeWave=profile.profile.xp;
      profile.recordWaveReached(6,{awardXp:false});
      expect(profile.profile.coins).toBe(coinsBeforeWave);
      expect(profile.profile.xp).toBe(xpBeforeWave);
      profile.recordZombieKill(2,{awardXp:false});
      expect(profile.profile.xp).toBe(xpBeforeWave);
      expect(profile.profile.coins).toBeGreaterThan(coinsBeforeWave);
      expect(profile.profile.totalKills).toBe(originalProfile.totalKills+1);
    } finally { Object.assign(profile.profile,originalProfile); profile.lastReward=originalReward; }
  });
  test("continued endless completion grants no player XP, currency or duplicate run-completed event", () => {
    const originalProfile=structuredClone(profile.profile),originalReward=profile.lastReward;
    try {
      profile.profile.xp=42;profile.profile.coins=600;profile.profile.gems=14;profile.profile.gamesPlayed=3;
      profile.profile.endlessBestWave=0;profile.profile.endlessBestScore=0;
      const completedBefore=profile.profile.dailyMissionProgress["game-completed"]?.progress??0;
      const reward=profile.completeEndlessRun(12,20,{awardXp:false,continuedAfterVictory:true});
      expect(profile.profile.xp).toBe(42);expect(profile.profile.coins).toBe(600);expect(profile.profile.gems).toBe(14);
      expect(profile.profile.gamesPlayed).toBe(3);
      expect(profile.profile.dailyMissionProgress["game-completed"]?.progress??0).toBe(completedBefore);
      expect(reward.xp).toBe(0);expect(reward.coins).toBe(0);expect(reward.gems).toBe(0);
      expect(profile.profile.endlessBestWave).toBe(12);
    } finally { Object.assign(profile.profile,originalProfile);profile.lastReward=originalReward; }
  });
  test("standalone endless rewards may retain credits but never player-level XP", () => {
    const originalProfile=structuredClone(profile.profile),originalReward=profile.lastReward;
    try {
      profile.profile.xp=51;profile.profile.coins=700;
      const playMissionProgress = profile.profile.dailyMissionProgress["daily-play-3"]?.progress ?? 0;
      const reward=profile.completeEndlessRun(8,14,{awardXp:false});
      expect(profile.profile.xp).toBe(51);
      expect(reward.xp).toBe(0);
      expect(profile.profile.coins).toBeGreaterThan(700);
      expect(profile.profile.dailyMissionProgress["daily-play-3"]?.progress ?? 0).toBe(playMissionProgress);
    } finally { Object.assign(profile.profile,originalProfile);profile.lastReward=originalReward; }
  });
});
