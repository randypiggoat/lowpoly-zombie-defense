export const BOSS_ENRAGE_HP_RATIO = 0.5;
export const BOSS_ENRAGE_SPEED_MULTIPLIER = 1.35;

export function shouldBossEnrage(
  isBoss: boolean,
  hp: number,
  maxHp: number,
  alreadyEnraged: boolean,
  hpRatio = BOSS_ENRAGE_HP_RATIO,
) {
  if (!isBoss || alreadyEnraged || maxHp <= 0) return false;
  return hp > 0 && hp <= maxHp * Math.max(0.1, Math.min(0.95, hpRatio));
}

export function bossSpeedMultiplier(
  isBoss: boolean,
  enraged: boolean,
  speedMultiplier = BOSS_ENRAGE_SPEED_MULTIPLIER,
) {
  return isBoss && enraged ? Math.max(1, speedMultiplier) : 1;
}
