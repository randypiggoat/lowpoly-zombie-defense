export const BOSS_ENRAGE_HP_RATIO = 0.5;
export const BOSS_ENRAGE_SPEED_MULTIPLIER = 1.35;

export function shouldBossEnrage(
  isBoss: boolean,
  hp: number,
  maxHp: number,
  alreadyEnraged: boolean,
) {
  if (!isBoss || alreadyEnraged || maxHp <= 0) return false;
  return hp > 0 && hp <= maxHp * BOSS_ENRAGE_HP_RATIO;
}

export function bossSpeedMultiplier(isBoss: boolean, enraged: boolean) {
  return isBoss && enraged ? BOSS_ENRAGE_SPEED_MULTIPLIER : 1;
}
