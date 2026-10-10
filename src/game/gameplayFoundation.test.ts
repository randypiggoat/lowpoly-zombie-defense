import { describe, expect, test } from "bun:test";
import { Game } from "./engine";
import { getStageById } from "./navigation";

describe("gameplay foundation", () => {
  test("wave three begins spawning normally without a power-selection interruption", () => {
    const game = new Game(() => 0.2);
    game.startStage({ ...getStageById(1), waveCount: 5 });

    game.state.wave = 2;
    game.state.spawnQueue = 0;
    game.state.zombies = [];
    game.state.waveTimer = 0;
    game.tick(0.1);

    expect(game.state.wave).toBe(3);
    expect(game.state.waveMessage).not.toBe("CHOOSE YOUR POWER");
    expect(game.state.spawnQueue + game.state.zombies.filter((zombie) => !zombie.dead).length).toBeGreaterThan(0);
  });
});
