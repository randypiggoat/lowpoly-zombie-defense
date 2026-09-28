export type BossHealthSummary = {
  currentHp: number;
  maxHp: number;
  ratio: number;
  count: number;
};

export function getBossHealthSummary(
  bosses: readonly { hp: number; maxHp: number; dead: boolean; boss: boolean }[],
): BossHealthSummary | null {
  const active = bosses.filter((boss) => boss.boss && !boss.dead && boss.hp > 0 && boss.maxHp > 0);
  if (active.length === 0) return null;

  const currentHp = active.reduce((sum, boss) => sum + boss.hp, 0);
  const maxHp = active.reduce((sum, boss) => sum + boss.maxHp, 0);

  return {
    currentHp,
    maxHp,
    ratio: Math.max(0, Math.min(1, currentHp / maxHp)),
    count: active.length,
  };
}
