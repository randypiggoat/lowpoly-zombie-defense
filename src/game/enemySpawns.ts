import type {
  StageBossConfig,
  StageEnemyKind,
  StageEnemyPool,
  StageGameplayConfig,
} from "./navigation";
import type { RandomSource } from "./random";

export type EnemySpawnStats = {
  hp: number;
  speed: number;
};

/**
 * Chooses the enemy kind for a normal spawn, while preserving boss-wave overrides.
 */
export function chooseEnemyKind(
  enemyPool: StageEnemyPool,
  boss: StageBossConfig,
  wave: number,
  waveTarget: number,
  random: RandomSource,
): StageEnemyKind {
  const isBossWave = boss.enabled && boss.wave === wave;

  if (isBossWave && boss.kind !== null) return boss.kind;

  const kinds = enemyPool.normalKinds;
  if (kinds.length === 0) return 0;

  const weights = enemyPool.weights;
  const progress = Math.max(0, (wave - 1) / Math.max(1, waveTarget - 1));
  const pool: Array<{ kind: StageEnemyKind; weight: number }> = [];

  for (const kind of kinds) {
    const baseWeight =
      kind === 0
        ? (weights?.walker ?? 1)
        : kind === 1
          ? (weights?.runner ?? 0.65)
          : kind === 2
            ? (weights?.brute ?? 0.45)
            : kind === 3
              ? (weights?.splitter ?? 0.3)
              : kind === 4
                ? (weights?.bomber ?? 0.22)
                : kind === 5
                  ? (weights?.guardian ?? 0.24)
                  : kind === 6
                    ? (weights?.healer ?? 0.18)
                    : (weights?.swarm ?? 0.3);

    const wavePressure =
      kind === 0
        ? 1 - progress * 0.35
        : kind === 1
          ? 0.35 + progress * 1.1
          : kind === 2
            ? progress < 0.22
              ? 0.2
              : 0.35 + progress * 0.95
            : kind === 3
              ? 0.1 + progress * 0.8
              : kind === 4
                ? 0.08 + progress * 0.7
                : kind === 5
                  ? 0.08 + progress * 0.55
                  : kind === 6
                    ? 0.05 + progress * 0.5
                    : 0.12 + progress * 0.95;

    pool.push({ kind, weight: Math.max(0.05, baseWeight * wavePressure) });
  }

  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let pick = random() * total;

  for (const entry of pool) {
    pick -= entry.weight;
    if (pick <= 0) return entry.kind;
  }

  return pool[pool.length - 1]!.kind;
}

/**
 * Calculates the existing HP and speed scaling for a spawned enemy.
 */
export function getEnemySpawnStats(
  gameplay: StageGameplayConfig,
  kind: StageEnemyKind,
  wave: number,
  waveTarget: number,
): EnemySpawnStats {
  const difficultyMult = Math.max(0.75, gameplay.waveDifficultyMultiplier);
  const healthMult = Math.max(0.7, gameplay.enemyHealthMultiplier);
  const speedMult = Math.max(0.7, gameplay.enemySpeedMultiplier);
  const progress = Math.max(0, (wave - 1) / Math.max(1, waveTarget - 1));
  const baseHp =
    18 *
    Math.pow(1.22, wave - 1) *
    (0.85 + difficultyMult * 0.22) *
    healthMult;
  const hpScale = 1 + progress * 0.45 + Math.max(0, wave - 3) * 0.02;

  const speedPressure = 1 + progress * 0.14;
  const speedBase =
    kind === 2
      ? 0.92
      : kind === 1
        ? 2.18
        : kind === 3
          ? 1.18
          : kind === 4
            ? 1.62
            : kind === 5
              ? 0.96
              : kind === 6
                ? 1.1
                : kind === 7
                  ? 2.65
                  : 1.36;
  const hpBase =
    kind === 2
      ? baseHp * 3.7
      : kind === 1
        ? baseHp * 0.8
        : kind === 3
          ? baseHp * 1.45
          : kind === 4
            ? baseHp * 0.95
            : kind === 5
              ? baseHp * 2.65
              : kind === 6
                ? baseHp * 1.35
                : kind === 7
                  ? baseHp * 0.52
                  : baseHp * 1.15;
  const finalHp = hpBase * hpScale;

  return {
    hp: finalHp,
    speed: speedBase * speedMult * speedPressure,
  };
}
