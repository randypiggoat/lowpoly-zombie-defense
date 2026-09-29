import { describe, expect, test } from "bun:test";
import { chooseEnemyKind, getEnemySpawnStats } from "./enemySpawns";
import { getStageById } from "./navigation";

describe("enemy spawn rules", () => {
  test("uses the only configured normal enemy kind", () => {
    const stage = getStageById(1);

    expect(
      chooseEnemyKind(stage.enemyPool, stage.boss, 3, stage.waveCount, () => 0.999999),
    ).toBe(1);
  });

  test("respects weighted selection at the low and high ends", () => {
    const stage = getStageById(1);

    expect(
      chooseEnemyKind(stage.enemyPool, stage.boss, 1, stage.waveCount, () => 0),
    ).toBe(0);

    expect(
      chooseEnemyKind(stage.enemyPool, stage.boss, 1, stage.waveCount, () => 0.999999),
    ).toBe(1);
  });

  test("boss waves always select the configured boss kind", () => {
    const stage = getStageById(5);

    expect(
      chooseEnemyKind(stage.enemyPool, stage.boss, 32, stage.waveCount, () => 0),
    ).toBe(2);

    expect(
      chooseEnemyKind(stage.enemyPool, stage.boss, 32, stage.waveCount, () => 0.999999),
    ).toBe(2);
  });

  test("empty normal pools safely fall back to walkers", () => {
    const stage = getStageById(1);

    expect(
      chooseEnemyKind(
        { normalKinds: [], weights: {} },
        stage.boss,
        1,
        stage.waveCount,
        () => 0.5,
      ),
    ).toBe(0);
  });

  test("keeps the existing HP and speed scaling at wave one", () => {
    const stage = getStageById(1);

    expect(getEnemySpawnStats(stage.gameplay, 0, 1, stage.waveCount)).toMatchObject({
      hp: expect.closeTo(17.282016, 10),
      speed: 1.2512,
    });

    expect(getEnemySpawnStats(stage.gameplay, 1, 1, stage.waveCount)).toMatchObject({
      hp: expect.closeTo(13.825613, 10),
      speed: 2.0056,
    });

    expect(getEnemySpawnStats(stage.gameplay, 2, 1, stage.waveCount)).toMatchObject({
      hp: expect.closeTo(63.943459, 10),
      speed: 0.8464,
    });
  });

  test("increases HP and speed pressure as a stage progresses", () => {
    const stage = getStageById(1);

    const early = getEnemySpawnStats(stage.gameplay, 0, 1, stage.waveCount);
    const late = getEnemySpawnStats(stage.gameplay, 0, 16, stage.waveCount);

    expect(late.hp).toBeGreaterThan(early.hp);
    expect(late.speed).toBeGreaterThan(early.speed);
  });
});
