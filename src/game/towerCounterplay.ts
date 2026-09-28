import type { StageEnemyKind } from "./navigation";
import type { TowerKind } from "./engine";

export type TowerCounterplayRule = {
  enemyKind: StageEnemyKind;
  damageMultiplier: number;
  label: string;
};

/**
 * Small, readable matchup bonuses make tower choice matter against special zombies.
 * Bonuses stay below 30% so they reward good counterplay without invalidating generalist towers.
 */
export const TOWER_COUNTERPLAY: Partial<Record<TowerKind, readonly TowerCounterplayRule[]>> = {
  rifleman: [
    { enemyKind: 1, damageMultiplier: 1.18, label: "Runner +18% damage" },
  ],
  shotgunner: [
    { enemyKind: 3, damageMultiplier: 1.18, label: "Splitter +18% damage" },
    { enemyKind: 7, damageMultiplier: 1.22, label: "Swarm +22% damage" },
  ],
  sniper: [
    { enemyKind: 2, damageMultiplier: 1.25, label: "Brute +25% damage" },
    { enemyKind: 5, damageMultiplier: 1.2, label: "Guardian +20% damage" },
  ],
  tesla: [
    { enemyKind: 7, damageMultiplier: 1.2, label: "Swarm +20% damage" },
  ],
  flamethrower: [
    { enemyKind: 3, damageMultiplier: 1.15, label: "Splitter +15% damage" },
    { enemyKind: 7, damageMultiplier: 1.2, label: "Swarm +20% damage" },
  ],
  rocket: [
    { enemyKind: 3, damageMultiplier: 1.12, label: "Splitter +12% damage" },
    { enemyKind: 7, damageMultiplier: 1.15, label: "Swarm +15% damage" },
  ],
  laser: [
    { enemyKind: 5, damageMultiplier: 1.25, label: "Guardian +25% damage" },
    { enemyKind: 2, damageMultiplier: 1.18, label: "Brute +18% damage" },
  ],
};

export function towerEnemyDamageMultiplier(
  towerKind: TowerKind,
  enemyKind: StageEnemyKind,
) {
  const rule = TOWER_COUNTERPLAY[towerKind]?.find((entry) => entry.enemyKind === enemyKind);
  return rule?.damageMultiplier ?? 1;
}

export function towerCounterplayLabels(towerKind: TowerKind) {
  return [...(TOWER_COUNTERPLAY[towerKind] ?? [])].map((entry) => entry.label);
}
