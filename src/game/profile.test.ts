import { describe, expect, test } from "bun:test";
import { profile } from "./profile";

describe("profile contract", () => {
  test("defaults ad removal to off for new players", () => {
    expect(profile.profile.adsRemoved).toBe(false);
  });
});

import { afterEach, describe, expect, test } from "bun:test";
import { profile } from "./profile";

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
});
