import { describe, expect, test } from "bun:test";
import { Game } from "./engine";
import { RUN_MODIFIER_DEFS } from "./runModifiers";
import { getStageById } from "./navigation";

describe("rewarded gameplay moments", () => {
  test("allows one free modifier reroll and one rewarded reroll", () => {
    const game = new Game(() => 0.25);
    game.startStage(getStageById(1));
    game.state.wave = 3;
    game.state.runModifierOffer = [
      RUN_MODIFIER_DEFS[0]!,
      RUN_MODIFIER_DEFS[1]!,
      RUN_MODIFIER_DEFS[2]!,
    ];

    expect(game.rerollRunModifier("free")).toBe(true);
    expect(game.state.modifierRerollsUsed).toBe(1);
    expect(game.rerollRunModifier("free")).toBe(false);

    expect(game.rerollRunModifier("rewarded")).toBe(true);
    expect(game.state.rewardedRerollsUsed).toBe(1);
    expect(game.rerollRunModifier("rewarded")).toBe(false);
  });

  test("revive restores the base, grants a shield window, and clears threats near base", () => {
    const game = new Game();
    game.startStage(getStageById(1));
    game.state.baseHp = 1;
    game.state.defeatOffer = true;
    game.state.defeatOfferTime = 4;
    game.state.revivesUsed = 0;
    game.state.zombies = [
      {
        id: 1,
        dist: 41,
        hp: 10,
        maxHp: 10,
        speed: 1,
        kind: 1,
        x: 0,
        y: 0,
        z: 0,
        wobble: 0,
        dead: false,
        fade: 0,
        flash: 0,
        slow: 0,
        burn: 0,
        burnTime: 0,
        healTimer: 0,
        healFlash: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        tilt: 0,
        spin: 0,
        roll: 0,
        gibbed: false,
      },
    ];

    expect(game.reviveRun()).toBe(true);
    expect(game.state.defeatOffer).toBe(false);
    expect(game.state.revivesUsed).toBe(1);
    expect(game.state.baseHp).toBe(8);
    expect(game.state.baseShieldTimer).toBe(3);
    expect(game.state.zombies[0]?.dead).toBe(true);
    expect(game.reviveRun()).toBe(false);
  });
});
