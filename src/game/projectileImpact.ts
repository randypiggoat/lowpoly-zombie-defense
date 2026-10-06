import type { Zombie } from "./engine";

export function getSplashTargets(
  zombies: readonly Zombie[],
  primaryTargetId: number,
  targetX: number,
  targetZ: number,
  radius: number,
  out: Zombie[] = [],
): Zombie[] {
  out.length = 0;
  if (radius <= 0) return out;

  const radiusSq = radius * radius;
  for (const zombie of zombies) {
    if (zombie.dead || zombie.id === primaryTargetId) continue;
    const dx = zombie.x - targetX;
    const dz = zombie.z - targetZ;
    if (dx * dx + dz * dz < radiusSq) {
      out.push(zombie);
    }
  }
  return out;
}

export function getChainTargets(
  zombies: readonly Zombie[],
  primaryTargetId: number,
  targetX: number,
  targetZ: number,
  chainCount: number,
  radius = 3.4,
  out: Zombie[] = [],
): Zombie[] {
  out.length = 0;
  if (chainCount <= 0) return out;

  const radiusSq = radius * radius;
  for (const zombie of zombies) {
    if (out.length >= chainCount) break;
    if (zombie.dead || zombie.id === primaryTargetId) continue;

    const dx = zombie.x - targetX;
    const dz = zombie.z - targetZ;
    if (dx * dx + dz * dz < radiusSq) {
      out.push(zombie);
    }
  }

  return out;
}
