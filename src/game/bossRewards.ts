export const BOSS_KILL_GOLD_MULTIPLIER = 1.5;

export function bossKillGoldMultiplier(isBoss: boolean) {
  return isBoss ? BOSS_KILL_GOLD_MULTIPLIER : 1;
}
