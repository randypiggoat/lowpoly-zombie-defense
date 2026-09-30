import { describe, expect, test } from "bun:test";
import { Game } from "./engine";
import { CHALLENGE_GAUNTLET, RESOURCE_OPS, SEASONAL_EVENT_RUNS, getEndlessSector, getEndlessSectorLabel } from "./sideModes";

describe("side mode catalog", () => {
  test("exposes distinct resource and challenge level tracks", () => {
    expect(RESOURCE_OPS.length).toBe(7);
    expect(CHALLENGE_GAUNTLET.length).toBe(8);
    expect(new Set(RESOURCE_OPS.map((level) => level.id)).size).toBe(RESOURCE_OPS.length);
    expect(new Set(CHALLENGE_GAUNTLET.map((level) => level.id)).size).toBe(CHALLENGE_GAUNTLET.length);
    expect(RESOURCE_OPS.some((level) => level.focus === "scrap")).toBe(true);
    expect(RESOURCE_OPS.some((level) => level.focus === "xp")).toBe(true);
    expect(RESOURCE_OPS.some((level) => level.focus === "gems")).toBe(true);
  });

  test("challenge restrictions are represented in data", () => {
    const oneTower = CHALLENGE_GAUNTLET.find((level) => level.id === "one-tower")!;
    const longShot = CHALLENGE_GAUNTLET.find((level) => level.id === "long-shot")!;
    expect(oneTower.maxTowers).toBe(1);
    expect(longShot.maxTowers).toBe(3);
    expect(longShot.allowedTowerKinds).toEqual(["rifleman", "sniper", "laser"]);
  });

  test("side modes start with the correct metadata and restrictions", () => {
    const game = new Game(() => 0.5);
    const challenge = CHALLENGE_GAUNTLET.find((level) => level.id === "one-tower")!;
    game.startSideMode(challenge, "2026-09-30");
    expect(game.state.gameMode).toBe("challenge");
    expect(game.state.sideModeId).toBe("one-tower");
    expect(game.state.sideModeLevel).toBe(1);
    expect(game.state.sideModeCycleKey).toBe("2026-09-30");
    expect(game.state.towers.length).toBe(0);
  });

  test("seasonal event runs are playable level definitions", () => {
    expect(SEASONAL_EVENT_RUNS.length).toBe(2);
    expect(SEASONAL_EVENT_RUNS.every((level) => level.category === "event")).toBe(true);
    expect(SEASONAL_EVENT_RUNS.every((level) => level.stage.waveCount <= 5)).toBe(true);
  });

  test("endless sectors provide readable progression milestones", () => {
    expect(getEndlessSector(1)).toBe(1);
    expect(getEndlessSector(5)).toBe(1);
    expect(getEndlessSector(6)).toBe(2);
    expect(getEndlessSector(11)).toBe(3);
    expect(getEndlessSectorLabel(11)).toBe("Quarantine");
  });
});
