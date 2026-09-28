export type KillStreakTier = {
  minStreak: number;
  goldMultiplier: number;
};

/**
 * Converts an active kill streak into a small in-run gold multiplier.
 * The bonus is intentionally capped so streaks reward skill without taking over the economy.
 */
export const KILL_STREAK_TIERS: readonly KillStreakTier[] = [
  { minStreak: 20, goldMultiplier: 1.3 },
  { minStreak: 10, goldMultiplier: 1.2 },
  { minStreak: 5, goldMultiplier: 1.1 },
  { minStreak: 3, goldMultiplier: 1.05 },
] as const;

export const MAX_KILL_STREAK_GOLD_MULTIPLIER = 1.3;

export function killStreakGoldMultiplier(streak: number) {
  const normalized = Math.max(0, Math.floor(streak));
  const tier = KILL_STREAK_TIERS.find((entry) => normalized >= entry.minStreak);
  return Math.min(MAX_KILL_STREAK_GOLD_MULTIPLIER, tier?.goldMultiplier ?? 1);
}

export function isKillStreakMilestone(streak: number) {
  const normalized = Math.max(0, Math.floor(streak));
  return KILL_STREAK_TIERS.some((entry) => entry.minStreak === normalized);
}
