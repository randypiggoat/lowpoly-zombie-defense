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

export type BossStatusFlags = {
  enraged: boolean;
  marked: boolean;
  stunned: boolean;
  burning: boolean;
  slowed: boolean;
  /** Below the shared execute threshold: execute towers finish bosses here. */
  vulnerable: boolean;
};

export const BOSS_VULNERABLE_RATIO = 0.22;

/** Which control/damage statuses are currently landing on any live boss — shown as counterplay hints. */
export function getBossStatusFlags(
  bosses: readonly {
    hp: number;
    maxHp: number;
    dead: boolean;
    boss: boolean;
    bossEnraged?: boolean;
    markTime?: number;
    stun?: number;
    burn: number;
    slow: number;
  }[],
): BossStatusFlags {
  const flags: BossStatusFlags = {
    enraged: false,
    marked: false,
    stunned: false,
    burning: false,
    slowed: false,
    vulnerable: false,
  };
  for (const boss of bosses) {
    if (!boss.boss || boss.dead || boss.hp <= 0) continue;
    flags.enraged ||= Boolean(boss.bossEnraged);
    flags.marked ||= (boss.markTime ?? 0) > 0;
    flags.stunned ||= (boss.stun ?? 0) > 0;
    flags.burning ||= boss.burn > 0;
    flags.slowed ||= boss.slow > 0;
    flags.vulnerable ||= boss.hp / Math.max(1, boss.maxHp) <= BOSS_VULNERABLE_RATIO;
  }
  return flags;
}
