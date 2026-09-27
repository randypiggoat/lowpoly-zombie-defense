import { describe, expect, test } from "bun:test";
import {
  createEndlessStage,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeekKey,
  hashString,
} from "./endless";

describe("endless challenge rotation", () => {
  test("hashing is deterministic", () => {
    expect(hashString("2026-09-27")).toBe(hashString("2026-09-27"));
  });

  test("daily rotation is stable and daily-only", () => {
    const a = getDailyChallenge("2026-09-27");
    const b = getDailyChallenge("2026-09-27");
    expect(a.id).toBe(b.id);
    expect(a.period).toBe("daily");
  });

  test("weekly rotation is stable and weekly-only", () => {
    const key = getWeekKey(new Date("2026-09-27T12:00:00"));
    const challenge = getWeeklyChallenge(key);
    expect(challenge.period).toBe("weekly");
  });

  test("endless stage has a long target and preserves the existing enemy roster", () => {
    const stage = createEndlessStage(getDailyChallenge("2026-09-27"));
    expect(stage.endless).toBe(true);
    expect(stage.waveCount).toBe(9999);
    expect(stage.enemyPool.normalKinds).toContain(7);
  });
});
