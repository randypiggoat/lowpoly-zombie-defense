import { describe, expect, test } from "bun:test";
import {
  MIN_INTERSTITIAL_GAP_MS,
  canShowInterstitial,
  isRewardedAvailable,
  rewardedPlacementLabel,
  purchaseLabel,
} from "./monetization";

describe("monetization foundation", () => {
  test("does not enable rewarded ads without a native provider", () => {
    expect(isRewardedAvailable()).toBe(false);
  });

  test("uses player-facing labels for reward placements", () => {
    expect(rewardedPlacementLabel("double-run-rewards")).toBe("Double run rewards");
    expect(rewardedPlacementLabel("revive")).toBe("Revive");
  });

  test("uses player-facing labels for store products", () => {
    expect(purchaseLabel("remove-ads")).toBe("Remove Ads");
  });

  test("blocks interstitials until the configured cooldown expires", () => {
    expect(
      canShowInterstitial({
        now: 1_000 + MIN_INTERSTITIAL_GAP_MS - 1,
        lastShownAt: 1_000,
        inCombat: false,
        adsRemoved: false,
      }),
    ).toBe(false);
    expect(
      canShowInterstitial({
        now: 1_000 + MIN_INTERSTITIAL_GAP_MS,
        lastShownAt: 1_000,
        inCombat: false,
        adsRemoved: false,
      }),
    ).toBe(true);
  });
});
