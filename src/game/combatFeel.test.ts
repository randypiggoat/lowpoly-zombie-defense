import { describe, expect, test } from "bun:test";
import { getCombatFeedback } from "./combatFeel";

describe("combat feedback", () => {
  test("explosions have the strongest shake", () => {
    expect(
      getCombatFeedback({ killed: true, crit: false, exploded: true, killStreak: 1 }),
    ).toEqual({ shake: 0.95, hitSound: "gib" });
  });

  test("kill streaks get stronger feedback", () => {
    expect(
      getCombatFeedback({ killed: true, crit: false, exploded: false, killStreak: 5 }),
    ).toEqual({ shake: 0.7, hitSound: "bigHit" });
  });

  test("ordinary hits remain subtle", () => {
    expect(
      getCombatFeedback({ killed: false, crit: false, exploded: false, killStreak: 0 }),
    ).toEqual({ shake: 0.04, hitSound: "hit" });
  });
});
