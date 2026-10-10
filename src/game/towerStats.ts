import type { Mods, Tower, TowerDef, TowerPathTiers } from "./towerStatsTypes";
import { getTowerUpgradeAbilities, type TowerKindKey } from "./towerUpgradeDesign";

export type TowerProfileBonus = {
  level: number;
  damage: number;
  rate: number;
  range: number;
};

export type TowerCombatStats = {
  damage: number;
  rate: number;
  range: number;
  slow: number;
  splash: number;
  chain: number;
  burn: number;
  crit: number;
  gore: number;
  gold: number;
  volley: number;
  stun: number;
  markDuration: number;
  markBonus: number;
  markSpreadRadius: number;
  squadRadius: number;
  squadDamageBonus: number;
  squadRangeBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
  stunnedMultiplier: number;
  burningMultiplier: number;
  swarmMultiplier: number;
  killRush: number;
  burnSpread: number;
  chainEscalation: number;
  eliteDamageMultiplier: number;
  precisionMultiplier: number;
  fastDamageMultiplier: number;
};

export function getTowerMods(
  tower: Pick<Tower, "kind" | "a" | "b">,
  paths: TowerPathTiers,
): Required<Mods> {
  const out: Required<Mods> = {
    dmg: 1,
    rate: 1,
    range: 1,
    slow: 0,
    splash: 0,
    chain: 0,
    crit: 0,
    gold: 1,
    gore: 1,
    burn: 0,
  };

  const apply = (path: "a" | "b", count: number) => {
    const tiers = paths[path].tiers;
    for (let i = 0; i < count; i++) {
      const mods = tiers[i]!.mods;
      if (mods.dmg) out.dmg *= mods.dmg;
      if (mods.rate) out.rate *= mods.rate;
      if (mods.range) out.range *= mods.range;
      if (mods.slow) out.slow = Math.max(out.slow, mods.slow);
      if (mods.splash) out.splash += mods.splash;
      if (mods.chain) out.chain += mods.chain;
      if (mods.crit) out.crit = Math.max(out.crit, mods.crit);
      if (mods.gold) out.gold *= mods.gold;
      if (mods.gore) out.gore = Math.max(out.gore, mods.gore);
      if (mods.burn) out.burn = Math.max(out.burn, mods.burn);
    }
  };

  apply("a", tower.a);
  apply("b", tower.b);
  return out;
}

export function getTowerCombatStats(
  tower: Pick<Tower, "kind" | "level" | "a" | "b">,
  definition: TowerDef,
  paths: TowerPathTiers,
  profileBonus: TowerProfileBonus,
): TowerCombatStats {
  const mods = getTowerMods(tower, paths);
  const levelDmg = Math.pow(1.04, tower.level - 1);
  const levelRate = Math.pow(1.01, tower.level - 1);
  const levelRange = Math.pow(1.01, tower.level - 1);

  const abilities = getTowerUpgradeAbilities(tower.kind as TowerKindKey, tower.a, tower.b);

  return {
    damage: definition.damage * mods.dmg * levelDmg * profileBonus.damage,
    rate: definition.rate * mods.rate * levelRate * profileBonus.rate,
    range: definition.range * mods.range * levelRange * profileBonus.range,
    slow: Math.max(definition.slow ?? 0, mods.slow),
    splash: Math.max(0, (definition.splash ?? 0) + mods.splash),
    chain: (definition.chain ?? 0) + mods.chain,
    burn:
      Math.max(definition.burn ?? 0, mods.burn) *
      levelDmg *
      profileBonus.damage,
    crit: mods.crit,
    gore: mods.gore,
    gold: mods.gold,
    ...abilities,
  };
}
