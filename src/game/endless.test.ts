import { describe, expect, test } from "bun:test";
import {
  createEndlessStage,
  getEndlessWaveScaling,
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
    expect(stage.waveCount).toBe(50);
    expect(stage.enemyPool.normalKinds).toContain(7);
  });
});


describe("endless wave scaling", () => {
  test("does not alter difficulty inside the authored range", () => {
    expect(getEndlessWaveScaling(10, 10)).toEqual({ enemyHealthMultiplier: 1, enemySpeedMultiplier: 1, waveSizeMultiplier: 1, spawnIntervalMultiplier: 1 });
    expect(getEndlessWaveScaling(3, 10)).toEqual(getEndlessWaveScaling(10, 10));
  });
  test("adds gradual pressure after the target and remains bounded", () => {
    const first=getEndlessWaveScaling(11,10), later=getEndlessWaveScaling(30,10), marathon=getEndlessWaveScaling(1000,10);
    expect(first.enemyHealthMultiplier).toBeGreaterThan(1);
    expect(later.enemyHealthMultiplier).toBeGreaterThan(first.enemyHealthMultiplier);
    expect(later.enemySpeedMultiplier).toBeGreaterThan(first.enemySpeedMultiplier);
    expect(later.waveSizeMultiplier).toBeGreaterThan(first.waveSizeMultiplier);
    expect(later.spawnIntervalMultiplier).toBeLessThan(first.spawnIntervalMultiplier);
    expect(marathon.enemyHealthMultiplier).toBeLessThanOrEqual(3);
    expect(marathon.enemySpeedMultiplier).toBeLessThanOrEqual(1.22);
    expect(marathon.waveSizeMultiplier).toBeLessThanOrEqual(1.8);
    expect(marathon.spawnIntervalMultiplier).toBeGreaterThanOrEqual(0.72);
  });
});
