import type { EnvironmentPropKind, StageEnvironmentId } from "./stageEnvironments";

export type BuildingStyle =
  | "residential" | "farm" | "market" | "industrial" | "river" | "ruins"
  | "mangrove" | "forest" | "ice-lab" | "cavern" | "harbor" | "desert"
  | "canyon" | "mine" | "military" | "city" | "foundry" | "graveyard"
  | "volcano" | "blacksite";

export type RoadStyle =
  | "rural" | "urban" | "industrial" | "river" | "jungle" | "swamp"
  | "forest" | "ice" | "harbor" | "desert" | "canyon" | "mine"
  | "military" | "graveyard" | "volcanic" | "blacksite";

export type BaseStyle = BuildingStyle;

export type EnvironmentPalette = {
  building: string;
  buildingAlt: string;
  trim: string;
  roof: string;
  glass: string;
  roadEdge: string;
  roadAccent: string;
  base: string;
  baseAccent: string;
};

export type EnvironmentVisualProfile = {
  id: StageEnvironmentId;
  buildingStyle: BuildingStyle;
  roadStyle: RoadStyle;
  baseStyle: BaseStyle;
  ambientKinds: readonly EnvironmentPropKind[];
  palette: EnvironmentPalette;
};

function palette(
  building: string, buildingAlt: string, trim: string, roof: string, glass: string,
  roadEdge: string, roadAccent: string, base: string, baseAccent: string,
): EnvironmentPalette {
  return { building, buildingAlt, trim, roof, glass, roadEdge, roadAccent, base, baseAccent };
}

export const ENVIRONMENT_VISUALS: Record<StageEnvironmentId, EnvironmentVisualProfile> = {
  suburban: { id: "suburban", buildingStyle: "residential", roadStyle: "rural", baseStyle: "residential", ambientKinds: ["tree", "shrub", "fence", "rock"], palette: palette("#b86f55","#d39a62","#efe0b9","#62433d","#93d6dc","#765f49","#ead39b","#938978","#e3b550") },
  orchard: { id: "orchard", buildingStyle: "farm", roadStyle: "rural", baseStyle: "farm", ambientKinds: ["tree","hay-bale","fence","rock"], palette: palette("#9a6a43","#c7955f","#e6d39e","#6c4a37","#9dd3c8","#765d46","#d9c27f","#8c7758","#e5bd62") },
  market: { id: "market", buildingStyle: "market", roadStyle: "urban", baseStyle: "market", ambientKinds: ["car","crate","barrel","lamp"], palette: palette("#8b6260","#c78b66","#e8d5af","#4e4b50","#a9dce1","#4d4946","#e4c475","#726160","#e9b44c") },
  "rail-yard": { id: "rail-yard", buildingStyle: "industrial", roadStyle: "industrial", baseStyle: "industrial", ambientKinds: ["container","barrel","crate","lamp"], palette: palette("#59636a","#7c858a","#c7a66a","#343b41","#82c9d5","#30373b","#d8b257","#505b63","#e0a550") },
  "river-checkpoint": { id: "river-checkpoint", buildingStyle: "river", roadStyle: "river", baseStyle: "river", ambientKinds: ["tree","rock","dock","barrel"], palette: palette("#796d56","#9a8a68","#d6c798","#4c5e56","#86c6ce","#5e695e","#d2c58e","#6f7c6b","#9dd7d0") },
  "jungle-ruins": { id: "jungle-ruins", buildingStyle: "ruins", roadStyle: "jungle", baseStyle: "ruins", ambientKinds: ["palm","shrub","rock","rubble"], palette: palette("#6c6b55","#8b835f","#b8a775","#45453a","#79bfc0","#5e5746","#c6a86d","#5c624d","#9ebf63") },
  mangrove: { id: "mangrove", buildingStyle: "mangrove", roadStyle: "swamp", baseStyle: "river", ambientKinds: ["palm","dead-tree","rock","dock"], palette: palette("#61725e","#7f8b65","#b6a978","#3f4c43","#78c4c7","#514f43","#c2aa6d","#596b59","#8bc7ad") },
  redwood: { id: "redwood", buildingStyle: "forest", roadStyle: "forest", baseStyle: "forest", ambientKinds: ["pine","rock","shed","dead-tree"], palette: palette("#765a42","#98765a","#c8b189","#39453e","#86c8cb","#584a3d","#cdb477","#665b4a","#a9c36a") },
  "frozen-lab": { id: "frozen-lab", buildingStyle: "ice-lab", roadStyle: "ice", baseStyle: "ice-lab", ambientKinds: ["ice","container","vent","crystal"], palette: palette("#c3d8dc","#edf5f5","#b9e2e9","#6b8791","#b3e7ed","#66777d","#d8eef0","#91adb7","#92d8e5") },
  "ice-cavern": { id: "ice-cavern", buildingStyle: "cavern", roadStyle: "ice", baseStyle: "cavern", ambientKinds: ["ice","crystal","rock","rubble"], palette: palette("#677d85","#8ca8ad","#c2e9ee","#3e5c67","#9fe1ea","#3e5962","#a8e4ea","#58717b","#8cdde7") },
  harbor: { id: "harbor", buildingStyle: "harbor", roadStyle: "harbor", baseStyle: "harbor", ambientKinds: ["container","barrel","dock","boat"], palette: palette("#5f6870","#879197","#e0c789","#3e454b","#8ed2db","#3f5258","#dbc27a","#59666b","#84ced7") },
  "desert-bazaar": { id: "desert-bazaar", buildingStyle: "desert", roadStyle: "desert", baseStyle: "desert", ambientKinds: ["cactus","rock","barrel","shed"], palette: palette("#a56f4f","#c58a56","#e5ca8e","#654334","#a7d4d0","#74543c","#d6b56b","#9a704d","#e3b55c") },
  "redrock-canyon": { id: "redrock-canyon", buildingStyle: "canyon", roadStyle: "canyon", baseStyle: "canyon", ambientKinds: ["boulder","rock","rubble"], palette: palette("#8f5a45","#b87554","#d5a06e","#4e3730","#a8d3cc","#69463a","#d8ae6a","#805443","#dc9b59") },
  "deep-mine": { id: "deep-mine", buildingStyle: "mine", roadStyle: "mine", baseStyle: "mine", ambientKinds: ["ore","crate","mine-cart","barrel"], palette: palette("#57575a","#74746d","#c2a363","#292d30","#87c4cc","#3d3d3a","#d4b66d","#4e5151","#b68a55") },
  "military-outpost": { id: "military-outpost", buildingStyle: "military", roadStyle: "military", baseStyle: "military", ambientKinds: ["sandbag","barrier","crate","antenna"], palette: palette("#596050","#77795e","#d0b66d","#303733","#8ec8cf","#3b403d","#e0b84e","#4b554b","#e3b84d") },
  "abandoned-city": { id: "abandoned-city", buildingStyle: "city", roadStyle: "urban", baseStyle: "city", ambientKinds: ["car","rubble","lamp","barrier"], palette: palette("#4e5961","#6b7780","#d0c4a0","#30373c","#8ed1d8","#343b40","#d7bf76","#515d65","#8fd3d8") },
  foundry: { id: "foundry", buildingStyle: "foundry", roadStyle: "industrial", baseStyle: "foundry", ambientKinds: ["container","pipe","barrel","vent"], palette: palette("#624d46","#8a6050","#d5ad75","#332d2b","#83c5c8","#3c3936","#d6a35c","#574843","#e06e49") },
  graveyard: { id: "graveyard", buildingStyle: "graveyard", roadStyle: "graveyard", baseStyle: "graveyard", ambientKinds: ["dead-tree","tombstone","rock","rubble"], palette: palette("#515a55","#6c736a","#c1bc9d","#30363a","#8fb9c2","#3e4242","#c7ba83","#464e49","#9f9b77") },
  volcano: { id: "volcano", buildingStyle: "volcano", roadStyle: "volcanic", baseStyle: "volcano", ambientKinds: ["boulder","rock","vent","rubble"], palette: palette("#704a3f","#9c614b","#d6a066","#392f2d","#8ac3c2","#463733","#df8d4f","#5d403a","#e06d45") },
  blacksite: { id: "blacksite", buildingStyle: "blacksite", roadStyle: "blacksite", baseStyle: "blacksite", ambientKinds: ["barrier","vent","antenna","pipe"], palette: palette("#485359","#657177","#9fbec2","#242a2f","#87d0d2","#2c3236","#d4bb68","#404b50","#6fe0db") },
};

export function getEnvironmentVisualProfile(id: StageEnvironmentId) {
  return ENVIRONMENT_VISUALS[id];
}
