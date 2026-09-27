import { describe, expect, test } from "bun:test";
import { MIN_INTERSTITIAL_GAP_MS, canShowInterstitial } from "./monetization";

describe("monetization policy", () => {
  test("allows a first transition ad", () => {
    expect(
      canShowInterstitial({
        now: 1_000,
        lastShownAt: null,
        inCombat: false,
        adsRemoved: false,
      }),
    ).toBe(true);
  });

  test("blocks interstitials during combat", () => {
    expect(
      canShowInterstitial({
        now: 10_000,
        lastShownAt: null,
        inCombat: true,
        adsRemoved: false,
      }),
    ).toBe(false);
  });

  test("enforces a hard cooldown", () => {
    const shown = 100_000;
    expect(
      canShowInterstitial({
        now: shown + MIN_INTERSTITIAL_GAP_MS - 1,
        lastShownAt: shown,
        inCombat: false,
        adsRemoved: false,
      }),
    ).toBe(false);
    expect(
      canShowInterstitial({
        now: shown + MIN_INTERSTITIAL_GAP_MS,
        lastShownAt: shown,
        inCombat: false,
        adsRemoved: false,
      }),
    ).toBe(true);
  });
});
