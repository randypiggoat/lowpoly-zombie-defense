import { describe, expect, test } from "bun:test";
import { Game } from "./engine";
import { RUN_MODIFIER_DEFS } from "./runModifiers";
import { getStageById } from "./navigation";

describe("gameplay foundation", () => {
  test("run modifier choice is required before the next wave can proceed", () => {
    const game = new Game(() => 0.2);
    game.startStage(getStageById(1));

    game.state.wave = 3;
    game.state.spawnQueue = 0;
    game.state.zombies = [];
    game.state.runModifierOffer = [RUN_MODIFIER_DEFS[0]!, RUN_MODIFIER_DEFS[1]!, RUN_MODIFIER_DEFS[2]!];

    expect(game.chooseRunModifier(RUN_MODIFIER_DEFS[0]!.id)).toBe(true);
    expect(game.state.activeRunModifiers).toEqual([RUN_MODIFIER_DEFS[0]!.id]);
    expect(game.state.runModifierOffer).toEqual([]);
    expect(game.state.spawnQueue).toBeGreaterThan(0);
  });

  test("an invalid modifier cannot bypass the choice", () => {
    const game = new Game();
    game.startStage(getStageById(1));

    expect(game.chooseRunModifier("bounty")).toBe(false);
    expect(game.state.activeRunModifiers).toEqual([]);
  });
});
