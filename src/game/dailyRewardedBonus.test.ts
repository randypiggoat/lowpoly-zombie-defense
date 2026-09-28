import { describe, expect, test } from "bun:test";
import { profile } from "./profile";

describe("daily rewarded bonus", () => {
  test("starts as claimable for a fresh profile", () => {
    expect(profile.profile.dailyRewardedBonusDate).toBeNull();
    expect(profile.canClaimDailyRewardedBonus).toBe(true);
  });

  test("claiming the bonus records the current day and blocks another claim", () => {
    const beforeCoins = profile.profile.coins;
    const beforeGems = profile.profile.gems;

    expect(profile.claimDailyRewardedBonus()).toBe(true);
    expect(profile.profile.coins).toBe(beforeCoins + 150);
    expect(profile.profile.gems).toBe(beforeGems + 1);
    expect(profile.canClaimDailyRewardedBonus).toBe(false);
    expect(profile.claimDailyRewardedBonus()).toBe(false);
  });
});
