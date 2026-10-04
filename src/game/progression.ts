export const STARTER_TOWERS = ["rifleman", "shotgunner", "freezer"] as const;

export type ProgressionTowerKind =
  | "rifleman"
  | "shotgunner"
  | "sniper"
  | "tesla"
  | "flamethrower"
  | "freezer"
  | "rocket"
  | "laser";

export type TowerUnlockPlan = {
  kind: ProgressionTowerKind;
  level: number;
  role: string;
};

export const TOWER_UNLOCK_PLAN: readonly TowerUnlockPlan[] = [
  { kind: "rifleman", level: 1, role: "Reliable single-target damage" },
  { kind: "shotgunner", level: 1, role: "Close-range crowd damage" },
  { kind: "freezer", level: 1, role: "Slow and control" },
  { kind: "sniper", level: 3, role: "Long-range elite damage" },
  { kind: "tesla", level: 5, role: "Chain damage and pack clearing" },
  { kind: "flamethrower", level: 7, role: "Sustained area damage" },
  { kind: "rocket", level: 9, role: "Burst and large explosions" },
  { kind: "laser", level: 12, role: "Late-game sustained single-target damage" },
];

export function towerUnlockLevel(kind: string): number {
  return TOWER_UNLOCK_PLAN.find((entry) => entry.kind === kind)?.level ?? 99;
}

export function towerUnlockRole(kind: string): string {
  return TOWER_UNLOCK_PLAN.find((entry) => entry.kind === kind)?.role ?? "Advanced tower";
}

export function isTowerUnlocked(
  kind: string,
  playerLevel: number,
  purchased: readonly string[] = [],
): boolean {
  return playerLevel >= towerUnlockLevel(kind) || purchased.includes(kind);
}

export function nextTowerUnlock(
  playerLevel: number,
  purchased: readonly string[] = [],
): TowerUnlockPlan | null {
  return (
    TOWER_UNLOCK_PLAN.find(
      (entry) => entry.level > playerLevel && !purchased.includes(entry.kind),
    ) ?? null
  );
}

export function towerUnlockProgress(
  kind: string,
  playerLevel: number,
  purchased: readonly string[] = [],
) {
  const requiredLevel = towerUnlockLevel(kind);
  return {
    unlocked: isTowerUnlocked(kind, playerLevel, purchased),
    requiredLevel,
    levelsRemaining: Math.max(0, requiredLevel - playerLevel),
  };
}

export const PROGRESSION_XP = {
  kill: 1,
  specialKill: 2,
  waveBase: 1,
  wavePerWave: 1,
  runBase: 40,
  runPerWave: 4,
  runPerKill: 0.25,
} as const;

export function progressionXpForRun(wave: number, kills: number, multiplier = 1) {
  return Math.max(
    0,
    Math.round(
      (PROGRESSION_XP.runBase +
        Math.max(0, wave) * PROGRESSION_XP.runPerWave +
        Math.max(0, kills) * PROGRESSION_XP.runPerKill) *
        Math.max(0.1, multiplier),
    ),
  );
}

export function progressionXpForWave(wave: number) {
  return Math.max(
    0,
    Math.round(PROGRESSION_XP.waveBase + Math.max(0, wave) * PROGRESSION_XP.wavePerWave),
  );
}

export function progressionXpForKill(kind: number) {
  return kind === 2 || kind === 4 || kind === 5 || kind === 6
    ? PROGRESSION_XP.specialKill
    : PROGRESSION_XP.kill;
}

/**
 * Account XP curve: quick onboarding, then progressively larger milestones.
 * Early-run flow (stage 1 first clear: ~16 waves, ~150 kills) awards roughly 650 XP:
 * kills ~170 + waves ~152 + run ~141 + stage completion/first-clear bonus 200.
 * The old curve (120 * 1.22^n) put that at level 5 (sniper + tesla in one run); this curve
 * puts it at level 3 (sniper only), with later towers needing more sessions.
 */
export function xpForLevel(level: number): number {
  return Math.round(250 * Math.pow(1.2, Math.max(0, level - 1)));
}
