import { describe, expect, test } from "bun:test";
import { profile } from "./profile";

describe("profile contract", () => {
  test("defaults ad removal to off for new players", () => {
    expect(profile.profile.adsRemoved).toBe(false);
  });
});
