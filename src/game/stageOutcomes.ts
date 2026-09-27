import type { StageEnemyKind } from "./navigation";

export function baseDamageForEnemy(kind: StageEnemyKind) {
  if (kind === 2) return 3;
  if (kind === 4) return 4;
  if (kind === 5) return 2;
  return 1;
}

export type BaseHitResult = {
  nextHealth: number;
  gameOver: boolean;
};

export function resolveBaseHit(
  baseHealth: number,
  kind: StageEnemyKind,
): BaseHitResult {
  const nextHealth = Math.max(0, baseHealth - baseDamageForEnemy(kind));

  return {
    nextHealth,
    gameOver: nextHealth <= 0,
  };
}

export function isStageWinReady(
  wave: number,
  waveTarget: number,
  spawnQueue: number,
  aliveZombies: boolean,
) {
  return (
    wave >= waveTarget &&
    spawnQueue === 0 &&
    !aliveZombies
  );
}
