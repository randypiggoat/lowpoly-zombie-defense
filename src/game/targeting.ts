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
  const candidates = zombies.filter((zombie) => {
    if (zombie.dead) return false;
    if (Math.hypot(zombie.x - tower.x, zombie.z - tower.z) > range) return false;
    return !map || hasLineOfSight(map, tower, zombie);
  });

  if (candidates.length === 0) return null;

  if (mode === "strongest") {
    return candidates.reduce((best, zombie) =>
      zombie.hp > best.hp ? zombie : best,
    );
  }

  if (mode === "last") {
    return candidates.reduce((best, zombie) =>
      zombie.dist < best.dist ? zombie : best,
    );
  }

  // "first" = zombie furthest along the path.
  return candidates.reduce((best, zombie) =>
    zombie.dist > best.dist ? zombie : best,
  );
}
