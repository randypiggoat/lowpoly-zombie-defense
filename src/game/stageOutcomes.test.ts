import { describe, expect, test } from "bun:test";
import { baseDamageForEnemy, isStageWinReady, resolveBaseHit } from "./stageOutcomes";

describe("stage outcome rules", () => {
  test("walkers and runners deal one base damage", () => {
    expect(baseDamageForEnemy(0)).toBe(1);
    expect(baseDamageForEnemy(1)).toBe(1);
  });

  test("brutes deal three base damage", () => {
    expect(baseDamageForEnemy(2)).toBe(3);
  });

  test("applies base damage without going below zero", () => {
    expect(resolveBaseHit(10, 0)).toEqual({
      nextHealth: 9,
      gameOver: false,
    });

    expect(resolveBaseHit(2, 2)).toEqual({
      nextHealth: 0,
      gameOver: true,
    });

    expect(resolveBaseHit(1, 0)).toEqual({
      nextHealth: 0,
      gameOver: true,
    });
  });

  test("win requires the final wave, empty spawn queue, and no living zombies", () => {
    expect(isStageWinReady(6, 6, 0, false)).toBe(true);
    expect(isStageWinReady(5, 6, 0, false)).toBe(false);
    expect(isStageWinReady(6, 6, 1, false)).toBe(false);
    expect(isStageWinReady(6, 6, 0, true)).toBe(false);
    expect(isStageWinReady(7, 6, 0, false)).toBe(true);
  });
});
