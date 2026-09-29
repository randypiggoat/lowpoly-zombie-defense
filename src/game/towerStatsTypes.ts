export type Mods = {
  dmg?: number;
  rate?: number;
  range?: number;
  slow?: number;
  splash?: number;
  chain?: number;
  crit?: number;
  gold?: number;
  gore?: number;
  burn?: number;
  /** Design-layer ability tags live in towerUpgradeDesign.ts. */
};

export type TowerKind = string;

export type Tower = {
  kind: TowerKind;
  level: number;
  a: number;
  b: number;
};

export type TowerDef = {
  damage: number;
  rate: number;
  range: number;
  slow?: number;
  splash?: number;
  chain?: number;
  burn?: number;
};

export type TowerPathTiers = {
  a: { tiers: Array<{ mods: Mods }> };
  b: { tiers: Array<{ mods: Mods }> };
};
