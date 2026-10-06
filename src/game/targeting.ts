import type { TargetMode, Vec2, Zombie } from "./engine";
import { hasLineOfSight, type StageMap } from "./maps";

type TargetingPosition = Pick<Vec2, "x" | "z">;

export function selectTowerTarget(
  zombies: readonly Zombie[],
  tower: TargetingPosition,
  range: number,
  mode: TargetMode,
  map?: StageMap,
): Zombie | null {
  let best: Zombie | null = null;
  const rangeSq = range * range;
  for (const zombie of zombies) {
    if (zombie.dead) continue;
    const dx = zombie.x - tower.x;
    const dz = zombie.z - tower.z;
    if (dx * dx + dz * dz > rangeSq) continue;
    if (map && !hasLineOfSight(map, tower, zombie)) continue;
    if (!best) {
      best = zombie;
      continue;
    }

    if (
      (mode === "strongest" && zombie.hp > best.hp) ||
      (mode === "last" && zombie.dist < best.dist) ||
      (mode === "first" && zombie.dist > best.dist)
    ) {
      best = zombie;
    }
  }
  return best;
}
