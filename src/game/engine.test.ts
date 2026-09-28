// Bun provides this module at test runtime; the project type checker does not
// include Bun's ambient module declarations.
// @ts-expect-error Bun test globals are available when this file runs under Bun.
import { describe, expect, test } from "bun:test";
import { BUILD_SPOTS, Game, type Zombie } from "./engine";
import { getStageById, type StageEnemyKind } from "./navigation";
import { createSeededRandom } from "./random";

function makeTestZombie(overrides: Partial<Zombie> = {}): Zombie {
  const pad = BUILD_SPOTS[0]!;
  return {
    id: 999_001,
    dist: 1,
    hp: 100,
    maxHp: 100,
    speed: 1,
    kind: 0,
    boss: false,
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

    for (let i = 0; i < 60 && game.state.kills === 0; i++) {
      game.tick(1 / 60);
    }

    expect(game.state.kills).toBe(1);
    expect(game.state.zombies[0]?.dead).toBe(true);
    expect(game.state.gold).toBeGreaterThan(140);
  });

  test("seeded randomness makes simulation results repeatable", () => {
    const run = () => {
      const game = new Game(createSeededRandom(12345));

      game.startStage(getStageById(1));
      game.tick(1);

      return game.state.zombies.map((zombie) => ({
        id: zombie.id,
        kind: zombie.kind,
        dist: zombie.dist,
        wobble: zombie.wobble,
      }));
    };

    expect(run()).toEqual(run());
  });
});



describe("combat hit semantics", () => {
  test("a high-damage ordinary hit is not treated as a critical hit", async () => {
    const { resolveDamage } = await import("./damage");
    const result = resolveDamage(100, 100, 40, 1, 1, false);
    expect(result.crit).toBe(false);
  });

  test("an explicitly rolled critical hit stays critical", async () => {
    const { resolveDamage } = await import("./damage");
    const result = resolveDamage(100, 100, 20, 1, 1, true);
    expect(result.crit).toBe(true);
  });
});


describe("simulation speed", () => {
  test("defaults to 1x and toggles to 2x", () => {
    const game = new Game();
    game.startStage(getStageById(1));

    expect(game.state.simulationSpeed).toBe(1);
    game.setSimulationSpeed(2);
    expect(game.state.simulationSpeed).toBe(2);
    game.setSimulationSpeed(1);
    expect(game.state.simulationSpeed).toBe(1);
  });

  test("2x advances the simulation clock twice as fast", () => {
    const game = new Game();
    game.startStage(getStageById(1));
    game.setSimulationSpeed(2);

    game.tick(0.5);

    expect(game.state.wave).toBe(1);
  });
});


describe("run modifier reroll", () => {
  test("allows one reroll and excludes the current offer", () => {
    const game = new Game(createSeededRandom(2026));
    game.startStage(getStageById(1));
    game.state.wave = 3;
    game.state.runModifierOffer = [
      { id: "overcharged", name: "Overcharged", description: "", effects: { rateMultiplier: 1.3 } },
      { id: "bounty", name: "Blood Money", description: "", effects: { goldMultiplier: 1.35 } },
      { id: "demolition", name: "Demolition", description: "", effects: { splashMultiplier: 1.4 } },
    ];
    
    expect(game.rerollRunModifierOffer()).toBe(true);
    expect(game.state.runModifierRerollUsed).toBe(true);
    expect(
      game.state.runModifierOffer.every(
        (modifier) =>
          !["overcharged", "bounty", "demolition"].includes(modifier.id),
      ),
    ).toBe(true);
    expect(game.rerollRunModifierOffer()).toBe(false);
  });
});


describe("second chance revive", () => {
  test("revives a defeated run once at half base health", () => {
    const game = new Game();
    game.startStage(getStageById(1));
    game.state.gameOver = true;
    game.state.stageWon = false;
    game.state.baseHp = 0;

    expect(game.reviveRun()).toBe(true);
    expect(game.state.gameOver).toBe(false);
    expect(game.state.baseHp).toBe(Math.ceil(game.state.baseMaxHp * 0.5));
    expect(game.state.reviveUsed).toBe(true);
    expect(game.reviveRun()).toBe(false);
  });
});


describe("boss spawn identity", () => {
  test("distinguishes true bosses from normal enemies of the same kind", () => {
    const game = new Game();
    game.startStage(getStageById(4));
    game.state.wave = 9;

    const spawn = (
      game as unknown as {
        spawn: (
          forcedKind?: StageEnemyKind,
          startDist?: number,
          isBoss?: boolean,
        ) => void;
      }
    ).spawn.bind(game);

    spawn(2, 0, false);
    spawn(2, 0, true);

    expect(game.state.zombies[0]?.kind).toBe(2);
    expect(game.state.zombies[0]?.boss).toBe(false);
    expect(game.state.zombies[1]?.kind).toBe(2);
    expect(game.state.zombies[1]?.boss).toBe(true);
  });
});
