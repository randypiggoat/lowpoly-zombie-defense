import type { StageEnemyKind } from "./navigation";

type EnemyIdentity = {
  name: string;
  role: string;
  healthBarColor: string;
};

const ENEMY_IDENTITIES: Record<StageEnemyKind, EnemyIdentity> = {
  0: { name: "Walker", role: "STANDARD", healthBarColor: "#e24b4b" },
  1: { name: "Runner", role: "FAST", healthBarColor: "#facc15" },
  2: { name: "Brute", role: "TANK", healthBarColor: "#fb923c" },
  3: { name: "Splitter", role: "SPLITS", healthBarColor: "#2dd4bf" },
  4: { name: "Bomber", role: "EXPLODES", healthBarColor: "#f87171" },
  5: { name: "Guardian", role: "SHIELDS", healthBarColor: "#60a5fa" },
  6: { name: "Healer", role: "HEALS", healthBarColor: "#4ade80" },
  7: { name: "Swarm", role: "PACK", healthBarColor: "#c084fc" },
};

export function enemyIdentity(kind: StageEnemyKind) {
  return ENEMY_IDENTITIES[kind];
}

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
  color: string;
};

export function getEnemyHealthBarPresentation(
  kind: StageEnemyKind,
  hp: number,
  maxHp: number,
  boss = false,
): EnemyHealthBarPresentation {
  const color = boss ? "#e9b44c" : enemyIdentity(kind).healthBarColor;
  if (hp <= 0 || maxHp <= 0) {
    return { show: false, widthMultiplier: 1, color };
  }
  return {
    show: kind >= 2 || boss,
    widthMultiplier: boss ? 1.6 : 1,
    color,
  };
}

export function enemyThreatLabel(kind: StageEnemyKind) {
  return enemyIdentity(kind).name.toUpperCase();
}

export function enemyThreatRole(kind: StageEnemyKind) {
  return enemyIdentity(kind).role;
}
