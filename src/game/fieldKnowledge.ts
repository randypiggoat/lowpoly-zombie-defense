export type KnowledgeCategory = "ARSENAL" | "FIELDCRAFT" | "SALVAGE";

export type KnowledgeEffect = {
  scrapMultiplier?: number;
  startingScrap?: number;
  towerCostMultiplier?: number;
  damageMultiplier?: number;
  rateMultiplier?: number;
  rangeMultiplier?: number;
  baseHealth?: number;
  sellMultiplier?: number;
};

export type FieldKnowledgeNode = {
  id: string;
  category: KnowledgeCategory;
  name: string;
  description: string;
  cost: number;
  prerequisite?: string;
  effect: KnowledgeEffect;
};

export const FIELD_KNOWLEDGE: readonly FieldKnowledgeNode[] = [
  { id: "arsenal-calibration", category: "ARSENAL", name: "Calibrated Sights", description: "All tower ranges +4%.", cost: 250, effect: { rangeMultiplier: 1.04 } },
  { id: "arsenal-overclock", category: "ARSENAL", name: "Quick Cycle", description: "All tower fire rates +4%.", cost: 400, prerequisite: "arsenal-calibration", effect: { rateMultiplier: 1.04 } },
  { id: "arsenal-training", category: "ARSENAL", name: "Field Drills", description: "All tower damage +5%.", cost: 650, prerequisite: "arsenal-overclock", effect: { damageMultiplier: 1.05 } },
  { id: "arsenal-veteran", category: "ARSENAL", name: "Veteran Crews", description: "First tower upgrade each run costs 12% less scrap.", cost: 950, prerequisite: "arsenal-training", effect: { towerCostMultiplier: 0.88 } },

  { id: "field-rations", category: "FIELDCRAFT", name: "Field Rations", description: "Start every defense with +20 SCRAP.", cost: 250, effect: { startingScrap: 20 } },
  { id: "field-reinforce", category: "FIELDCRAFT", name: "Reinforced Core", description: "Base starts with +1 health.", cost: 400, prerequisite: "field-rations", effect: { baseHealth: 1 } },
  { id: "field-bulkhead", category: "FIELDCRAFT", name: "Emergency Bulkhead", description: "Tower resale returns +8% more SCRAP.", cost: 650, prerequisite: "field-reinforce", effect: { sellMultiplier: 1.08 } },
  { id: "field-logistics", category: "FIELDCRAFT", name: "Rapid Logistics", description: "First tower placed each run costs 8% less SCRAP.", cost: 950, prerequisite: "field-bulkhead", effect: { towerCostMultiplier: 0.92 } },

  { id: "salvage-scanner", category: "SALVAGE", name: "Salvage Scanner", description: "Zombie kills yield +8% SCRAP.", cost: 250, effect: { scrapMultiplier: 1.08 } },
  { id: "salvage-rig", category: "SALVAGE", name: "Heavy Rig", description: "Zombie kills yield another +6% SCRAP.", cost: 400, prerequisite: "salvage-scanner", effect: { scrapMultiplier: 1.06 } },
  { id: "salvage-bounty", category: "SALVAGE", name: "Bounty Ledger", description: "Boss and elite kills yield +12% SCRAP.", cost: 650, prerequisite: "salvage-rig", effect: { scrapMultiplier: 1.12 } },
  { id: "salvage-network", category: "SALVAGE", name: "Salvage Network", description: "Keep more SCRAP when selling towers.", cost: 950, prerequisite: "salvage-bounty", effect: { sellMultiplier: 1.1 } },
];

export type FieldKnowledgeEffects = {
  scrapMultiplier: number;
  startingScrap: number;
  towerCostMultiplier: number;
  damageMultiplier: number;
  rateMultiplier: number;
  rangeMultiplier: number;
  baseHealth: number;
  sellMultiplier: number;
};

export const DEFAULT_FIELD_KNOWLEDGE_EFFECTS: FieldKnowledgeEffects = {
  scrapMultiplier: 1,
  startingScrap: 0,
  towerCostMultiplier: 1,
  damageMultiplier: 1,
  rateMultiplier: 1,
  rangeMultiplier: 1,
  baseHealth: 0,
  sellMultiplier: 1,
};

export function resolveFieldKnowledgeEffects(ranks: Record<string, number>): FieldKnowledgeEffects {
  const out = { ...DEFAULT_FIELD_KNOWLEDGE_EFFECTS };
  for (const node of FIELD_KNOWLEDGE) {
    if (!(ranks[node.id] > 0)) continue;
    const e = node.effect;
    if (e.scrapMultiplier) out.scrapMultiplier *= e.scrapMultiplier;
    if (e.startingScrap) out.startingScrap += e.startingScrap;
    if (e.towerCostMultiplier) out.towerCostMultiplier *= e.towerCostMultiplier;
    if (e.damageMultiplier) out.damageMultiplier *= e.damageMultiplier;
    if (e.rateMultiplier) out.rateMultiplier *= e.rateMultiplier;
    if (e.rangeMultiplier) out.rangeMultiplier *= e.rangeMultiplier;
    if (e.baseHealth) out.baseHealth += e.baseHealth;
    if (e.sellMultiplier) out.sellMultiplier *= e.sellMultiplier;
  }
  return out;
}

export function knowledgeUnlocked(
  node: FieldKnowledgeNode,
  ranks: Record<string, number>,
) {
  return !node.prerequisite || ranks[node.prerequisite] > 0;
}
