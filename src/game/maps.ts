export type MapVec2 = { x: number; z: number };

export type MapRect = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  label: string;
};

export type StageMapId =
  | "neighborhood"
  | "orchard"
  | "market"
  | "rail-yard"
  | "river-checkpoint"
  | "jungle-ruins"
  | "mangrove"
  | "redwood"
  | "frozen-lab"
  | "ice-cavern"
  | "harbor"
  | "desert-bazaar"
  | "redrock-canyon"
  | "deep-mine"
  | "military-outpost"
  | "abandoned-city"
  | "foundry"
  | "graveyard"
  | "volcano"
  | "blacksite";

export type StageMap = {
  id: StageMapId;
  name: string;
  path: MapVec2[];
  pathWidth: number;
  base: MapVec2;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  buildClearance: number;
  towerClearance: number;
  obstacles: MapRect[];
  placementTip: string;
  environmentId: import("./stageEnvironments").StageEnvironmentId;
};

const COMMON_BOUNDS = { minX: -14.5, maxX: 14.5, minZ: -24, maxZ: 17 };

export const STAGE_MAPS: Record<StageMapId, StageMap> = {
  "neighborhood": {
    id: "neighborhood",
    name: "Neighborhood",
    path: [
      { x: -11, z: -22 },
      { x: -11, z: -15 },
      { x: -1.5, z: -15 },
      { x: -1.5, z: -9 },
      { x: 8, z: -9 },
      { x: 8, z: -2 },
      { x: -4, z: -2 },
      { x: -4, z: 6 },
      { x: 8, z: 6 },
      { x: 8, z: 11.5 },
      { x: -4, z: 11.5 },
      { x: -4, z: 13.4 },
    ],
    pathWidth: 2.7,
    base: { x: -4, z: 13.4 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.8,
    towerClearance: 1.55,
    obstacles: [
      { x: 3.8, z: -19, width: 4.4, depth: 3.4, height: 1.15, label: "Family house" },
      { x: -9, z: -4.2, width: 3.4, depth: 3.1, height: 0.95, label: "Garage" },
      { x: 10, z: 10.5, width: 3.8, depth: 2.5, height: 0.65, label: "Garden wall" },
    ],
    placementTip: "The residential bends create premium crossfire corners while the outer lawns reward long-range coverage.",
    environmentId: "suburban",
  },
  "orchard": {
    id: "orchard",
    name: "Amber Orchard",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -13 }, { x: -4, z: -13 }, { x: -4, z: -5 },
      { x: 9, z: -5 }, { x: 9, z: 4 }, { x: -8, z: 4 }, { x: -8, z: 10 }, { x: -2, z: 10 }, { x: -2, z: 14 },
    ],
    pathWidth: 2.7,
    base: { x: -2, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.8,
    towerClearance: 1.5,
    obstacles: [
      { x: 9.8, z: -19.5, width: 3.5, depth: 3, height: 0.85, label: "Orchard shed" },
      { x: -9.3, z: -2.2, width: 3.1, depth: 2.8, height: 0.6, label: "Irrigation house" },
      { x: 10, z: 8.5, width: 3.6, depth: 2.8, height: 0.65, label: "Packing shed" },
      { x: 6.5, z: 12.7, width: 2.4, depth: 2.2, height: 0.6, label: "Crate yard" },
    ],
    placementTip: "Alternating long and short lanes make high-range towers valuable while the return bend rewards splash.",
    environmentId: "orchard",
  },
  "market": {
    id: "market",
    name: "Old Town Market",
    path: [
      { x: -10, z: -22 }, { x: -10, z: -17 }, { x: 6, z: -17 }, { x: 6, z: -11 },
      { x: -5, z: -11 }, { x: -5, z: -4 }, { x: 10, z: -4 }, { x: 10, z: 3 },
      { x: -9, z: 3 }, { x: -9, z: 9 }, { x: -3, z: 9 }, { x: -3, z: 13.5 },
    ],
    pathWidth: 2.75,
    base: { x: -3, z: 15 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.8, z: -20, width: 3, depth: 2.8, height: 0.9, label: "Market stalls" },
      { x: -10.5, z: -7, width: 2.8, depth: 2.8, height: 0.85, label: "Cafe block" },
      { x: 10.7, z: 6.8, width: 3.1, depth: 2.9, height: 0.85, label: "Storefront" },
      { x: -11.1, z: 13.1, width: 2.4, depth: 1.9, height: 0.7, label: "Arcade stall" },
    ],
    placementTip: "The repeated S-bends form premium chain and splash pockets while keeping several open edge placements.",
    environmentId: "market",
  },
  "rail-yard": {
    id: "rail-yard",
    name: "Copper Rail Yard",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -11 }, { x: -2, z: -11 }, { x: -2, z: -1 },
      { x: 9, z: -1 }, { x: 9, z: 7 }, { x: -9, z: 7 }, { x: -9, z: 12 }, { x: -4, z: 12 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.85,
    base: { x: -4, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.6,
    obstacles: [
      { x: 9.9, z: -18.7, width: 3.3, depth: 3.1, height: 1.15, label: "Rail warehouse" },
      { x: -9.7, z: -2.4, width: 3.2, depth: 2.6, height: 0.8, label: "Signal hut" },
      { x: 10.8, z: 3.4, width: 2.9, depth: 2.7, height: 0.9, label: "Freight stack" },
      { x: -11, z: 14, width: 2.5, depth: 1.8, height: 0.7, label: "Tool shed" },
    ],
    placementTip: "The central crossing lane creates a high-value crossfire position; the edges are safer but see less traffic.",
    environmentId: "rail-yard",
  },
  "river-checkpoint": {
    id: "river-checkpoint",
    name: "Willow River Checkpoint",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -16 }, { x: 1, z: -16 }, { x: 1, z: -8 },
      { x: 10, z: -8 }, { x: 10, z: 0 }, { x: -8, z: 0 }, { x: -8, z: 7 }, { x: 2, z: 7 }, { x: 2, z: 13.5 }, { x: -4, z: 13.5 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: 10.8, z: -18.8, width: 3, depth: 2.8, height: 0.85, label: "Ranger cabin" },
      { x: -10.5, z: -4.1, width: 3.2, depth: 2.5, height: 0.7, label: "Checkpoint hut" },
      { x: 10.7, z: 4.4, width: 3.2, depth: 2.6, height: 0.65, label: "Boat house" },
      { x: -10.5, z: 12.5, width: 3, depth: 1.9, height: 0.75, label: "Watch hut" },
    ],
    placementTip: "Long riverbank lanes reward precision towers; the short return near the base is the final splash safety net.",
    environmentId: "river-checkpoint",
  },
  "jungle-ruins": {
    id: "jungle-ruins",
    name: "Verdant Ruins",
    path: [
      { x: -10, z: -22 }, { x: -10, z: -14 }, { x: -3, z: -14 }, { x: -3, z: -7 },
      { x: 8, z: -7 }, { x: 8, z: 2 }, { x: -7, z: 2 }, { x: -7, z: 9 }, { x: -1, z: 9 }, { x: -1, z: 14 },
    ],
    pathWidth: 2.7,
    base: { x: -1, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.8,
    towerClearance: 1.5,
    obstacles: [
      { x: 10, z: -18.6, width: 3, depth: 3.1, height: 1.2, label: "Stone ruin" },
      { x: -10, z: -3.1, width: 2.8, depth: 2.5, height: 0.9, label: "Collapsed wall" },
      { x: 10.5, z: 4.7, width: 3.1, depth: 2.9, height: 1.1, label: "Temple room" },
      { x: -10.5, z: 12.2, width: 2.7, depth: 2, height: 0.8, label: "Relic plinth" },
    ],
    placementTip: "Dense jungle edges hide the tactical shape; keep towers near the clearings where the path doubles back.",
    environmentId: "jungle-ruins",
  },
  "mangrove": {
    id: "mangrove",
    name: "Mirewater Mangrove",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -16 }, { x: 6, z: -16 }, { x: 6, z: -10 },
      { x: -9, z: -10 }, { x: -9, z: -3 }, { x: 8, z: -3 }, { x: 8, z: 4 },
      { x: -7, z: 4 }, { x: -7, z: 10 }, { x: -3, z: 10 }, { x: -3, z: 14 },
    ],
    pathWidth: 2.85,
    base: { x: -3, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.8, z: -19.2, width: 3.1, depth: 2.7, height: 0.7, label: "Boardwalk hut" },
      { x: -10.8, z: -5.2, width: 2.6, depth: 2.4, height: 0.8, label: "Fallen roots" },
      { x: 10.7, z: 6.6, width: 3, depth: 2.8, height: 0.8, label: "Boathouse" },
      { x: 9.3, z: 13.0, width: 2.7, depth: 2, height: 0.8, label: "Shrine wall" },
    ],
    placementTip: "Wide water channels squeeze the best tower pads toward a few dry islands, making coverage geometry matter.",
    environmentId: "mangrove",
  },
  "redwood": {
    id: "redwood",
    name: "Ironwood Pass",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -15 }, { x: -2, z: -15 }, { x: -2, z: -9 },
      { x: 10, z: -9 }, { x: 10, z: -3 }, { x: -6, z: -3 }, { x: -6, z: 4 },
      { x: 8, z: 4 }, { x: 8, z: 10 }, { x: -4, z: 10 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.8,
    base: { x: -4, z: 15.7 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.6,
    obstacles: [
      { x: 11, z: -19.2, width: 2.8, depth: 3.2, height: 1.2, label: "Forest cabin" },
      { x: -10.7, z: -2.4, width: 3, depth: 2.8, height: 0.7, label: "Log stack" },
      { x: 10.8, z: 6.8, width: 3, depth: 2.6, height: 0.75, label: "Ranger station" },
      { x: -10.2, z: 13, width: 3.2, depth: 1.8, height: 0.8, label: "Saw shed" },
    ],
    placementTip: "The alternating tree corridors make broad coverage useful; the tight upper bend is a premium close-range post.",
    environmentId: "redwood",
  },
  "frozen-lab": {
    id: "frozen-lab",
    name: "Whiteglass Research Station",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -14 }, { x: 5, z: -14 }, { x: 5, z: -8 },
      { x: -8, z: -8 }, { x: -8, z: -1 }, { x: 9, z: -1 }, { x: 9, z: 6 },
      { x: -6, z: 6 }, { x: -6, z: 11 }, { x: -3, z: 11 }, { x: -3, z: 14 },
    ],
    pathWidth: 2.85,
    base: { x: -3, z: 15.6 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: 10.5, z: -19, width: 3.1, depth: 2.9, height: 1.15, label: "Research annex" },
      { x: -10.8, z: -3.7, width: 3, depth: 2.5, height: 1, label: "Generator hut" },
      { x: 10.7, z: 3.6, width: 3.2, depth: 2.7, height: 1.15, label: "Cryo lab" },
      { x: 9.4, z: 13, width: 2.8, depth: 1.9, height: 0.8, label: "Supply locker" },
    ],
    placementTip: "Clean white lanes exaggerate range differences, while the narrow bends provide deliberate close-range anchors.",
    environmentId: "frozen-lab",
  },
  "ice-cavern": {
    id: "ice-cavern",
    name: "Blueglass Cavern",
    path: [
      { x: -10, z: -22 }, { x: -10, z: -12 }, { x: 8, z: -12 }, { x: 8, z: -5 },
      { x: -7, z: -5 }, { x: -7, z: 2 }, { x: 9, z: 2 }, { x: 9, z: 9 },
      { x: -5, z: 9 }, { x: -5, z: 13 }, { x: -4, z: 14.2 },
    ],
    pathWidth: 2.75,
    base: { x: -4, z: 15.3 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.8, z: -18.8, width: 2.8, depth: 3.1, height: 1.3, label: "Ice shelf" },
      { x: -10.5, z: -2.4, width: 3, depth: 2.5, height: 1.1, label: "Frozen wall" },
      { x: 10.7, z: 5.5, width: 3.1, depth: 2.7, height: 1.25, label: "Crystal wall" },
      { x: -10, z: 13, width: 3, depth: 1.8, height: 1.1, label: "Cave shelf" },
    ],
    placementTip: "Sharp turns force earlier commitment to tower positions; central open ground is the safest all-purpose coverage zone.",
    environmentId: "ice-cavern",
  },
  "harbor": {
    id: "harbor",
    name: "Stormbreak Harbor",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -15 }, { x: 8, z: -15 }, { x: 8, z: -9 },
      { x: -4, z: -9 }, { x: -4, z: -2 }, { x: 10, z: -2 }, { x: 10, z: 5 },
      { x: -10, z: 5 }, { x: -10, z: 11 }, { x: -4, z: 11 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 15.7 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: 11, z: -19, width: 3, depth: 2.8, height: 1.05, label: "Harbor warehouse" },
      { x: -10.8, z: -4.3, width: 2.8, depth: 2.5, height: 0.8, label: "Dock office" },
      { x: 11, z: 8.4, width: 3.2, depth: 2.7, height: 1.1, label: "Cargo shed" },
      { x: -10.5, z: 13, width: 2.9, depth: 1.8, height: 0.8, label: "Net loft" },
    ],
    placementTip: "Open dockside sightlines reward long-range towers, while the inner turns are the high-value defensive core.",
    environmentId: "harbor",
  },
  "desert-bazaar": {
    id: "desert-bazaar",
    name: "Sunscar Bazaar",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -16 }, { x: 4, z: -16 }, { x: 4, z: -10 },
      { x: -8, z: -10 }, { x: -8, z: -4 }, { x: 8, z: -4 }, { x: 8, z: 2 },
      { x: -4, z: 2 }, { x: -4, z: 8 }, { x: 5, z: 8 }, { x: 5, z: 13.5 }, { x: -4, z: 13.5 },
    ],
    pathWidth: 2.8,
    base: { x: -4, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.8, z: -19, width: 3, depth: 2.8, height: 0.9, label: "Bazaar stall" },
      { x: -10.7, z: -2.4, width: 3.1, depth: 2.5, height: 0.95, label: "Caravan shop" },
      { x: 10.8, z: 6.2, width: 3.1, depth: 2.8, height: 0.85, label: "Tea house" },
      { x: 8.6, z: 12.7, width: 2.5, depth: 1.8, height: 0.7, label: "Supply tent" },
    ],
    placementTip: "Sparse desert ground creates clean sightlines, but each bend is exposed; spend placements near the center of the route.",
    environmentId: "desert-bazaar",
  },
  "redrock-canyon": {
    id: "redrock-canyon",
    name: "Redrock Narrows",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -14 }, { x: 7, z: -14 }, { x: 7, z: -7 },
      { x: -6, z: -7 }, { x: -6, z: 0 }, { x: 8, z: 0 }, { x: 8, z: 7 },
      { x: -7, z: 7 }, { x: -7, z: 12 }, { x: -4, z: 12 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.55,
    base: { x: -4, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.8,
    towerClearance: 1.5,
    obstacles: [
      { x: 11, z: -19.1, width: 2.7, depth: 3.2, height: 1.4, label: "Canyon pillar" },
      { x: -10.6, z: -3, width: 3, depth: 2.5, height: 1.1, label: "Rock shelf" },
      { x: 10.7, z: 3.8, width: 3.1, depth: 2.7, height: 1.25, label: "Canyon pillar" },
      { x: -10.4, z: 13, width: 2.8, depth: 1.9, height: 1.1, label: "Rock shelf" },
    ],
    placementTip: "The narrow route boosts exposure time, but limited clearings make each high-coverage tower position contested.",
    environmentId: "redrock-canyon",
  },
  "deep-mine": {
    id: "deep-mine",
    name: "Blackvein Mine",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -13 }, { x: 2, z: -13 }, { x: 2, z: -6 },
      { x: -9, z: -6 }, { x: -9, z: 1 }, { x: 7, z: 1 }, { x: 7, z: 8 },
      { x: -2, z: 8 }, { x: -2, z: 12 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.7,
    base: { x: -4, z: 15.4 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.8, z: -18.9, width: 3, depth: 3.1, height: 1.2, label: "Mine office" },
      { x: -10.7, z: -2.5, width: 3.1, depth: 2.5, height: 1.0, label: "Timber supports" },
      { x: 10.7, z: 5.5, width: 3.2, depth: 2.7, height: 1.15, label: "Ore shed" },
      { x: 8.8, z: 13, width: 2.7, depth: 1.9, height: 0.85, label: "Lift house" },
    ],
    placementTip: "Mine walls create a rhythm of cramped and open chambers; central placements can cover multiple chambers.",
    environmentId: "deep-mine",
  },
  "military-outpost": {
    id: "military-outpost",
    name: "Fort Ember",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -17 }, { x: 5, z: -17 }, { x: 5, z: -10 },
      { x: -7, z: -10 }, { x: -7, z: -3 }, { x: 7, z: -3 }, { x: 7, z: 4 },
      { x: -9, z: 4 }, { x: -9, z: 10 }, { x: 3, z: 10 }, { x: 3, z: 14 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 15.7 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.7, z: -20, width: 3.1, depth: 2.8, height: 1.15, label: "Bunker" },
      { x: -10.7, z: -3.1, width: 3, depth: 2.6, height: 1.0, label: "Motor pool" },
      { x: 10.7, z: 6.5, width: 3.1, depth: 2.7, height: 1.2, label: "Command post" },
      { x: -10.6, z: 13, width: 3, depth: 1.8, height: 0.85, label: "Ammo bunker" },
    ],
    placementTip: "The fortified central corridor creates a few elite crossfire positions; side pads become fallback posts.",
    environmentId: "military-outpost",
  },
  "abandoned-city": {
    id: "abandoned-city",
    name: "Hollowpoint City",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -16 }, { x: 8, z: -16 }, { x: 8, z: -11 },
      { x: -8, z: -11 }, { x: -8, z: -5 }, { x: 6, z: -5 }, { x: 6, z: 1 },
      { x: -10, z: 1 }, { x: -10, z: 7 }, { x: 7, z: 7 }, { x: 7, z: 12 }, { x: -4, z: 12 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.85,
    base: { x: -4, z: 15.7 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: 10.8, z: -19.2, width: 3.3, depth: 3, height: 2.2, label: "Apartment block" },
      { x: -10.7, z: -2.1, width: 3.2, depth: 2.8, height: 1.8, label: "Parking deck" },
      { x: 10.8, z: 4.2, width: 3.3, depth: 2.9, height: 2.0, label: "Office block" },
      { x: -10.3, z: 13, width: 3.1, depth: 1.9, height: 1.7, label: "Collapsed storefront" },
    ],
    placementTip: "Alleys compress the route and buildings break sightlines visually; the broad center remains the safest all-purpose placement zone.",
    environmentId: "abandoned-city",
  },
  "foundry": {
    id: "foundry",
    name: "Ashline Foundry",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -12 }, { x: 7, z: -12 }, { x: 7, z: -6 },
      { x: -7, z: -6 }, { x: -7, z: 0 }, { x: 9, z: 0 }, { x: 9, z: 6 },
      { x: -6, z: 6 }, { x: -6, z: 11 }, { x: 4, z: 11 }, { x: 4, z: 14 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 15.7 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: 11, z: -19.3, width: 3.2, depth: 3, height: 1.7, label: "Warehouse" },
      { x: -10.7, z: -2.6, width: 3.1, depth: 2.7, height: 1.25, label: "Machine bay" },
      { x: 10.8, z: 4.2, width: 3.2, depth: 2.8, height: 1.5, label: "Boiler block" },
      { x: -10.3, z: 13, width: 3, depth: 1.8, height: 1.1, label: "Tool cage" },
    ],
    placementTip: "Long industrial lanes create sustained damage windows; tight returns force a final layer of close-range coverage.",
    environmentId: "foundry",
  },
  "graveyard": {
    id: "graveyard",
    name: "Hallowed Grounds",
    path: [
      { x: -10, z: -22 }, { x: -10, z: -15 }, { x: 2, z: -15 }, { x: 2, z: -9 },
      { x: -8, z: -9 }, { x: -8, z: -2 }, { x: 7, z: -2 }, { x: 7, z: 5 },
      { x: -6, z: 5 }, { x: -6, z: 10 }, { x: 1, z: 10 }, { x: 1, z: 13 }, { x: -4, z: 13.5 },
    ],
    pathWidth: 2.75,
    base: { x: -4, z: 15.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 10.7, z: -19.2, width: 3, depth: 3, height: 1.4, label: "Crypt" },
      { x: -10.5, z: -4, width: 2.8, depth: 2.5, height: 1.0, label: "Mausoleum" },
      { x: 10.6, z: 6.6, width: 3.1, depth: 2.7, height: 1.3, label: "Chapel house" },
      { x: 9.2, z: 13, width: 2.8, depth: 1.8, height: 1.0, label: "Gatehouse" },
    ],
    placementTip: "The graveyard’s repeating corners create reliable kill zones, but the final upper bend is deliberately cramped.",
    environmentId: "graveyard",
  },
  "volcano": {
    id: "volcano",
    name: "Cinderfall Caldera",
    path: [
      { x: -11, z: -22 }, { x: -11, z: -14 }, { x: 4, z: -14 }, { x: 4, z: -8 },
      { x: -6, z: -8 }, { x: -6, z: -1 }, { x: 8, z: -1 }, { x: 8, z: 6 },
      { x: -7, z: 6 }, { x: -7, z: 11 }, { x: 0, z: 11 }, { x: 0, z: 14 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.6,
    base: { x: -4, z: 15.8 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.8,
    towerClearance: 1.5,
    obstacles: [
      { x: 10.7, z: -18.9, width: 2.8, depth: 3.2, height: 1.5, label: "Basalt outcrop" },
      { x: -10.5, z: -3, width: 3, depth: 2.6, height: 1.25, label: "Lava shelf" },
      { x: 10.5, z: 4, width: 3, depth: 2.7, height: 1.4, label: "Basalt outcrop" },
      { x: -10.3, z: 13, width: 2.9, depth: 1.9, height: 1.2, label: "Lava shelf" },
    ],
    placementTip: "The narrow volcanic route is about sustained exposure and strong corners; avoid overcommitting to one short lane.",
    environmentId: "volcano",
  },
  "blacksite": {
    id: "blacksite",
    name: "Blacksite Omega",
    path: [
      { x: -12, z: -22 }, { x: -12, z: -17 }, { x: 7, z: -17 }, { x: 7, z: -12 },
      { x: -8, z: -12 }, { x: -8, z: -6 }, { x: 8, z: -6 }, { x: 8, z: 0 },
      { x: -9, z: 0 }, { x: -9, z: 6 }, { x: 8, z: 6 }, { x: 8, z: 11 },
      { x: -1, z: 11 }, { x: -1, z: 14 }, { x: -4, z: 14 },
    ],
    pathWidth: 2.95,
    base: { x: -4, z: 15.9 },
    bounds: COMMON_BOUNDS,
    buildClearance: 2,
    towerClearance: 1.6,
    obstacles: [
      { x: 10.8, z: -20, width: 3.1, depth: 2.7, height: 1.6, label: "Security block" },
      { x: -10.8, z: -2.4, width: 3.3, depth: 2.8, height: 1.5, label: "Containment wing" },
      { x: 10.7, z: 3.6, width: 3.3, depth: 2.9, height: 1.7, label: "Research wing" },
      { x: -10.4, z: 13, width: 3, depth: 1.9, height: 1.3, label: "Control bunker" },
    ],
    placementTip: "The final map alternates broad sightlines and hard turns, demanding a layered defense instead of one dominant tower nest.",
    environmentId: "blacksite",
  },
};

const MAP_BY_STAGE_ID: Record<number, StageMapId> = {
  1: "neighborhood",
  2: "orchard",
  3: "market",
  4: "rail-yard",
  5: "river-checkpoint",
  6: "jungle-ruins",
  7: "mangrove",
  8: "redwood",
  9: "frozen-lab",
  10: "ice-cavern",
  11: "harbor",
  12: "desert-bazaar",
  13: "redrock-canyon",
  14: "deep-mine",
  15: "military-outpost",
  16: "abandoned-city",
  17: "foundry",
  18: "graveyard",
  19: "volcano",
  20: "blacksite",
};

export function getStageMap(mapId?: StageMapId | null) {
  return STAGE_MAPS[mapId ?? "highway"] ?? STAGE_MAPS.highway;
}

export function hasLineOfSight(map: StageMap, from: MapVec2, to: MapVec2) {
  return !map.obstacles.some((obstacle) => segmentIntersectsRect(from, to, obstacle));
}

export function getStageMapByStageId(stageId: number) {
  return STAGE_MAPS[MAP_BY_STAGE_ID[stageId] ?? "neighborhood"];
}

export function getPathLength(path: readonly MapVec2[]) {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    length += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.z - path[i - 1]!.z);
  }
  return length;
}

export function pointAtPath(path: readonly MapVec2[], distance: number): MapVec2 {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const segment = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= segment) {
      const t = segment === 0 ? 0 : remaining / segment;
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
      };
    }
    remaining -= segment;
  }
  return path[path.length - 1]!;
}

function pointToSegmentDistance(point: MapVec2, a: MapVec2, b: MapVec2) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lenSq = abx * abx + abz * abz;
  if (lenSq <= 0.000001) return Math.hypot(point.x - a.x, point.z - a.z);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * abx + (point.z - a.z) * abz) / lenSq),
  );
  const closestX = a.x + abx * t;
  const closestZ = a.z + abz * t;
  return Math.hypot(point.x - closestX, point.z - closestZ);
}

export function distanceToPath(map: StageMap, point: MapVec2) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < map.path.length; i++) {
    best = Math.min(best, pointToSegmentDistance(point, map.path[i - 1]!, map.path[i]!));
  }
  return best;
}

export function insideRect(point: MapVec2, rect: MapRect, padding = 0) {
  return (
    point.x >= rect.x - rect.width / 2 - padding &&
    point.x <= rect.x + rect.width / 2 + padding &&
    point.z >= rect.z - rect.depth / 2 - padding &&
    point.z <= rect.z + rect.depth / 2 + padding
  );
}

export function snapBuildPosition(map: StageMap, x: number, z: number): MapVec2 {
  const snap = 0.5;
  const clampedX = Math.max(map.bounds.minX, Math.min(map.bounds.maxX, x));
  const clampedZ = Math.max(map.bounds.minZ, Math.min(map.bounds.maxZ, z));
  return {
    x: Math.round(clampedX / snap) * snap,
    z: Math.round(clampedZ / snap) * snap,
  };
}

export type PlacementReason = "ok" | "off-map" | "road" | "obstacle" | "too-close";

export type PlacementCheck = {
  valid: boolean;
  reason: PlacementReason;
};

export function canPlaceTower(
  map: StageMap,
  x: number,
  z: number,
  existing: readonly MapVec2[] = [],
): PlacementCheck {
  if (
    x < map.bounds.minX ||
    x > map.bounds.maxX ||
    z < map.bounds.minZ ||
    z > map.bounds.maxZ
  ) {
    return { valid: false, reason: "off-map" };
  }

  const point = snapBuildPosition(map, x, z);

  if (distanceToPath(map, point) < map.buildClearance) {
    return { valid: false, reason: "road" };
  }

  if (
    Math.hypot(point.x - map.base.x, point.z - map.base.z) <
    map.buildClearance + 1.25
  ) {
    return { valid: false, reason: "too-close" };
  }

  if (map.obstacles.some((obstacle) => insideRect(point, obstacle, 0.35))) {
    return { valid: false, reason: "obstacle" };
  }

  if (existing.some((tower) => Math.hypot(tower.x - point.x, tower.z - point.z) < map.towerClearance)) {
    return { valid: false, reason: "too-close" };
  }

  return { valid: true, reason: "ok" };
}

export function placementKey(x: number, z: number) {
  const snappedX = Math.round(x * 2);
  const snappedZ = Math.round(z * 2);
  return snappedX * 1000 + snappedZ + 500_000;
}

export function pathCoverageRatio(
  map: StageMap,
  x: number,
  z: number,
  range: number,
) {
  if (range <= 0) return 0;
  const total = getPathLength(map.path);
  if (total <= 0) return 0;
  let covered = 0;
  const sampleStep = 0.75;
  for (let d = 0; d <= total; d += sampleStep) {
    const point = pointAtPath(map.path, d);
    if (Math.hypot(point.x - x, point.z - z) <= range) covered += sampleStep;
  }
  return Math.min(1, covered / total);
}
