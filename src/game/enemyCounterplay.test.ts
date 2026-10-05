import { describe, expect, test } from "bun:test";
import { Game, BUILD_SPOTS } from "./engine";
import { getEnemySpawnStats } from "./enemySpawns";
import { getStageById } from "./navigation";
import { baseDamageForEnemy } from "./stageOutcomes";

describe("enemy counterplay", () => {
  test("special enemies have distinct combat profiles", () => {
    const stage = getStageById(5);

    const splitter = getEnemySpawnStats(stage.gameplay, 3, 5, stage.waveCount);
    const bomber = getEnemySpawnStats(stage.gameplay, 4, 5, stage.waveCount);
    const guardian = getEnemySpawnStats(stage.gameplay, 5, 5, stage.waveCount);
    const healer = getEnemySpawnStats(stage.gameplay, 6, 5, stage.waveCount);
    const swarm = getEnemySpawnStats(stage.gameplay, 7, 5, stage.waveCount);

    expect(splitter.hp).toBeGreaterThan(swarm.hp);
    expect(bomber.speed).toBeGreaterThan(guardian.speed);
    expect(guardian.hp).toBeGreaterThan(healer.hp);
    expect(swarm.speed).toBeGreaterThan(splitter.speed);
  });

  test("bombers and guardians change base pressure", () => {
    expect(baseDamageForEnemy(0)).toBe(1);
    expect(baseDamageForEnemy(2)).toBe(3);
    expect(baseDamageForEnemy(4)).toBe(4);
    expect(baseDamageForEnemy(5)).toBe(2);
  });

  test("killing a splitter creates two swarmers near its current position", () => {
    const game = new Game(() => 0.99);
    game.startStage(getStageById(4));
    game.state.wave = 1;
    game.state.spawnQueue = 0;
    game.state.waveTimer = 999;

    expect(game.build(0, "rifleman")).toBe(true);

    const pad = BUILD_SPOTS[0]!;
    game.state.zombies.push({
      id: 5000,
      dist: 8,
      hp: 1,
      maxHp: 1,
      speed: 1,
      kind: 3,
      boss: false,
      bossEnraged: false,
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
      hitReact: 0,
      hitX: 0,
      hitZ: 0,
      hitForce: 0,
    });

    for (let i = 0; i < 20; i++) game.tick(1 / 60);

    const spawned = game.state.zombies.filter((z) => z.kind === 7 && z.id !== 5000);
    expect(spawned).toHaveLength(2);
    expect(spawned.every((z) => z.maxHp > 0)).toBe(true);
    expect(game.state.zombies.find((z) => z.id === 5000)?.dead).toBe(true);
  });
});
