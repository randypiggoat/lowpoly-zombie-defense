import { describe, expect, test } from "bun:test";
import { getEnemiesRemaining, getRoundProgress } from "./hudMetrics";

describe("in-game HUD metrics", () => {
  test("counts queued enemies and active enemies, but never dead enemies", () => {
    expect(
      getEnemiesRemaining({
        spawnQueue: 4,
        zombies: [{ dead: false }, { dead: true }, { dead: false }],
      }),
    ).toBe(6);
  });

  test("never returns a negative horde count", () => {
    expect(getEnemiesRemaining({ spawnQueue: -2, zombies: [{ dead: true }] })).toBe(0);
  });

  test("reports opening, current, and remaining campaign rounds accurately", () => {
    expect(getRoundProgress(0, 15)).toEqual({
      currentRound: 1,
      maximumRounds: 15,
      roundsRemaining: 15,
      progressPercent: 0,
    });
    expect(getRoundProgress(6, 15)).toEqual({
      currentRound: 6,
      maximumRounds: 15,
      roundsRemaining: 9,
      progressPercent: 40,
    });
    expect(getRoundProgress(15, 15)).toEqual({
      currentRound: 15,
      maximumRounds: 15,
      roundsRemaining: 0,
      progressPercent: 100,
    });
  });

  test("endless progress loops by ten-wave sectors without a finite rounds-left claim", () => {
    expect(getRoundProgress(17, 40, true)).toEqual({
      currentRound: 17,
      maximumRounds: 40,
      roundsRemaining: 23,
      progressPercent: 70,
    });
    expect(getRoundProgress(0, 40, true).progressPercent).toBe(0);
  });
});
