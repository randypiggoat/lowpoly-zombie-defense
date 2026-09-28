export type DamageResolution = {
  nextHp: number;
  popupValue: number;
  crit: boolean;
  killed: boolean;
  killGold: number;
  overkill: number;
  force: number;
  explode: boolean;
};

export function resolveDamage(
  hp: number,
  maxHp: number,
  damage: number,
  goreBase: number,
  goldMult = 1,
  crit = false,
): DamageResolution {
  const nextHp = hp - damage;
  const popupValue = Math.max(1, Math.round(damage));
  const isCrit = crit;
  const killed = nextHp <= 0;

  if (!killed) {
    return {
      nextHp,
      popupValue,
      crit: isCrit,
      killed: false,
      killGold: 0,
      overkill: 0,
      force: 0,
      explode: false,
    };
  }

  const killGold = Math.round((4 + Math.floor(maxHp / 12)) * goldMult);
  const overkill = Math.min(3, -nextHp / Math.max(1, maxHp) + 1);
  const force = goreBase * (0.8 + overkill * 0.6);
  const explode = force > 1.9 || -nextHp > maxHp * 0.6;

  return {
    nextHp,
    popupValue,
    crit: isCrit,
    killed: true,
    killGold,
    overkill,
    force,
    explode,
  };
}
