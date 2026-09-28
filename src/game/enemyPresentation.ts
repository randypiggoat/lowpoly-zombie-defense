import type { StageEnemyKind } from "./navigation";

export function shouldShowEnemyHealthBar(
  kind: StageEnemyKind,
  hp: number,
  maxHp: number,
) {
  return kind >= 2 && hp > 0 && maxHp > 0;
}

export function enemyThreatLabel(kind: StageEnemyKind) {
  switch (kind) {
    case 2: return "BRUTE";
    case 3: return "SPLITTER";
    case 4: return "BOMBER";
    case 5: return "GUARDIAN";
    case 6: return "HEALER";
    case 7: return "SWARM";
    case 1: return "RUNNER";
    default: return "WALKER";
  }
}
