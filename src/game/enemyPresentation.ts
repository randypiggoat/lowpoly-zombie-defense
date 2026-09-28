import type { StageEnemyKind } from "./navigation";

export function shouldShowEnemyHealthBar(
  kind: StageEnemyKind,
  hp: number,
  maxHp: number,
) {
  return kind >= 2 && hp > 0 && maxHp > 0;
}

export type EnemyHealthBarPresentation = {
  show: boolean;
  widthMultiplier: number;
};

export function getEnemyHealthBarPresentation(
  kind: StageEnemyKind,
  hp: number,
  maxHp: number,
  boss = false,
): EnemyHealthBarPresentation {
  if (hp <= 0 || maxHp <= 0) {
    return { show: false, widthMultiplier: 1 };
  }
  return {
    show: kind >= 2 || boss,
    widthMultiplier: boss ? 1.6 : 1,
  };
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
