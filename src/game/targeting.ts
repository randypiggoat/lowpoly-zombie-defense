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
  for (const zombie of zombies) {
    if (zombie.dead) continue;
    if (Math.hypot(zombie.x - tower.x, zombie.z - tower.z) > range) continue;
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
