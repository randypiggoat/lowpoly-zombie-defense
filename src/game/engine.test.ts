import { describe, expect, test } from "bun:test";
import {
  BUILD_SPOTS,
  Game,
  type Zombie,
  getStageById,
} from "./engine";

function makeTestZombie(overrides: Partial<Zombie> = {}): Zombie {
  const pad = BUILD_SPOTS[0]!;
  return {
    id: 999_001,
    dist: 1,
    hp: 100,
    maxHp: 100,
    speed: 1,
    kind: 0,
    x: pad.x,
    y: 0,
    z: pad.z,
    wobble: 0,
    dead: false,
    fade: 0,
    flash: 0,
    slow: 0,
    burn: 0,
    burnTime: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    tilt: 0,
    spin: 0,
    roll: 0,
    gibbed: false,
    ...overrides,
  };
}

describe("Game simulation", () => {
  test("initializes a stage with its configured starting state", () => {
    const game = new Game();
    const stage = getStageById(1);

    game.startStage(stage);

    expect(game.state.stageId).toBe(stage.id);
    expect(game.state.gold).toBe(stage.startingCoins);
    expect(game.state.baseHp).toBe(stage.startingBaseHealth);
    expect(game.state.baseMaxHp).toBe(stage.startingBaseHealth);
    expect(game.state.wave).toBe(0);
    expect(game.state.gameOver).toBe(false);
    expect(game.state.stageWon).toBe(false);
    expect(game.state.towers).toHaveLength(0);
  });

  test("starts the first wave after the initial delay", () => {
    const game = new Game();

    game.startStage(getStageById(1));

    game.tick(0.5);
    expect(game.state.wave).toBe(0);

    game.tick(0.5);

    expect(game.state.wave).toBe(1);
    expect(game.state.waveMessage).toBe("WAVE 1");
    expect(game.state.spawnQueue + game.state.zombies.length).toBeGreaterThan(0);
  });

  test("builds a tower on an empty spot and charges its cost", () => {
    const game = new Game();
    game.startStage(getStageById(1));

    const startingGold = game.state.gold;
    const built = game.build(0, "rifleman");

    expect(built).toBe(true);
    expect(game.state.towers).toHaveLength(1);
    expect(game.state.towers[0]?.kind).toBe("rifleman");
    expect(game.state.towers[0]?.spot).toBe(0);
    expect(game.state.gold).toBe(startingGold - 40);
    expect(game.state.towersPlaced).toBe(1);
  });

  test("a tower can damage and kill a zombie during the simulation tick", () => {
    const game = new Game();
    game.startStage(getStageById(1));

    expect(game.build(0, "rifleman")).toBe(true);

    const pad = BUILD_SPOTS[0]!;
    game.state.zombies.push(
      makeTestZombie({
        id: 123,
        hp: 1,
        maxHp: 1,
        x: pad.x,
        z: pad.z,
      }),
    );

    game.tick(1 / 60);

    expect(game.state.kills).toBe(1);
    expect(game.state.zombies[0]?.dead).toBe(true);
    expect(game.state.gold).toBe(144);
  });
});
