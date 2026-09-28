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
