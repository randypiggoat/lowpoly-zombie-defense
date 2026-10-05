export type TowerEconomyDef = {
  cost: number;
  upgradeBase: number;
};

export type TowerEconomyTower = {
  kind: string;
  level: number;
  a: number;
  b: number;
};

export type TowerEconomyPaths = {
  a: { tiers: readonly { cost: number }[] };
  b: { tiers: readonly { cost: number }[] };
};

export function towerUpgradeCost(
  tower: Pick<TowerEconomyTower, "level">,
  definition: TowerEconomyDef,
  maxLevel: number,
) {
  if (tower.level >= maxLevel) return Infinity;
  return Math.round(definition.upgradeBase * Math.pow(1.55, tower.level - 1));
}

export function canBuyTier(tower: Pick<TowerEconomyTower, "a" | "b">, path: "a" | "b") {
  const mine = path === "a" ? tower.a : tower.b;
  const other = path === "a" ? tower.b : tower.a;

  if (mine >= 4) return false;
  if (mine >= 2 && other >= 3) return false;

  return true;
}

export function tierCost(
  tower: Pick<TowerEconomyTower, "a" | "b" | "kind">,
  path: "a" | "b",
  paths: TowerEconomyPaths,
) {
  const mine = path === "a" ? tower.a : tower.b;

  if (mine >= 4) return Infinity;

  return paths[path].tiers[mine]?.cost ?? Infinity;
}

export function towerSellValue(
  tower: Pick<TowerEconomyTower, "level" | "a" | "b" | "kind">,
  definition: TowerEconomyDef,
  paths: TowerEconomyPaths,
  maxLevel: number,
) {
  let spent = definition.cost;

  for (let i = 0; i < tower.a; i++) {
    spent += paths.a.tiers[i]?.cost ?? 0;
  }

  for (let i = 0; i < tower.b; i++) {
    spent += paths.b.tiers[i]?.cost ?? 0;
  }

  return Math.floor(spent * 0.6);
}
