import type { Zombie } from "./engine";

export function getSplashTargets(
  zombies: readonly Zombie[],
  primaryTargetId: number,
  targetX: number,
  targetZ: number,
  radius: number,
): Zombie[] {
  if (radius <= 0) return [];

  return zombies.filter((zombie) => {
    if (zombie.dead || zombie.id === primaryTargetId) return false;
    return Math.hypot(zombie.x - targetX, zombie.z - targetZ) < radius;
  });
}

export function getChainTargets(
  zombies: readonly Zombie[],
  primaryTargetId: number,
  targetX: number,
  targetZ: number,
  chainCount: number,
  radius = 3.4,
): Zombie[] {
  if (chainCount <= 0) return [];

  const targets: Zombie[] = [];

  for (const zombie of zombies) {
    if (targets.length >= chainCount) break;
    if (zombie.dead || zombie.id === primaryTargetId) continue;

    if (Math.hypot(zombie.x - targetX, zombie.z - targetZ) < radius) {
      targets.push(zombie);
    }
  }

  return targets;
}
