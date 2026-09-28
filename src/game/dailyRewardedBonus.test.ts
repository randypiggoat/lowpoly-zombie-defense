import { describe, expect, test } from "bun:test";
import { profile } from "./profile";

describe("daily rewarded bonus", () => {
  test("starts as claimable for a fresh profile", () => {
    expect(profile.profile.dailyRewardedBonusDate).toBeNull();
    expect(profile.canClaimDailyRewardedBonus).toBe(true);
  });

  test("claiming the bonus records the current day and blocks another claim", () => {
    const previous = {
      coins: profile.profile.coins,
      gems: profile.profile.gems,
      date: profile.profile.dailyRewardedBonusDate,
    };

    try {
      profile.profile.dailyRewardedBonusDate = null;
      profile.profile.coins = 0;
      profile.profile.gems = 0;

      expect(profile.claimDailyRewardedBonus()).toBe(true);
      expect(profile.profile.coins).toBe(150);
      expect(profile.profile.gems).toBe(1);
      expect(profile.canClaimDailyRewardedBonus).toBe(false);
      expect(profile.claimDailyRewardedBonus()).toBe(false);
    } finally {
      profile.profile.coins = previous.coins;
      profile.profile.gems = previous.gems;
      profile.profile.dailyRewardedBonusDate = previous.date;
    }
  });
});
