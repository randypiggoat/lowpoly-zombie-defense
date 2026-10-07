export type StageEnvironmentId =
  | "suburban"
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

export type EnvironmentPropKind =
  | "tree"
  | "pine"
  | "palm"
  | "dead-tree"
  | "rock"
  | "boulder"
  | "cactus"
  | "shrub"
  | "crate"
  | "barrel"
  | "fence"
  | "lamp"
  | "car"
  | "container"
  | "ice"
  | "crystal"
  | "dock"
  | "boat"
  | "mine-cart"
  | "ore"
  | "sandbag"
  | "tombstone"
  | "rubble"
  | "pipe"
  | "vent"
  | "antenna"
  | "barrier"
  | "hay-bale"
  | "shed" | "igloo";

export type EnvironmentLandmarkKind =
  | "windmill"
  | "giant-tree"
  | "market-arcade"
  | "rail-signal"
  | "water-tower"
  | "jungle-gate"
  | "mangrove-shrine"
  | "redwood-giant"
  | "frozen-lab"
  | "ice-cave"
  | "lighthouse"
  | "oasis"
  | "canyon-bridge"
  | "mine-headframe"
  | "radar-dish"
  | "skyscraper"
  | "foundry-furnace"
  | "cathedral"
  | "volcano-crater"
  | "reactor";

export type EnvironmentProp = {
  kind: EnvironmentPropKind;
  position: [number, number, number];
  scale: number;
  rotation: number;
};

export type EnvironmentLandmark = {
  kind: EnvironmentLandmarkKind;
  position: [number, number, number];
  scale: number;
  rotation: number;
};

export type StageEnvironmentDefinition = {
  id: StageEnvironmentId;
  label: string;
  landmark: EnvironmentLandmark;
  props: EnvironmentProp[];
};

function prop(
  kind: EnvironmentPropKind,
  x: number,
  z: number,
  scale = 1,
  rotation = 0,
): EnvironmentProp {
  return { kind, position: [x, 0, z], scale, rotation };
}

function landmark(
  kind: EnvironmentLandmarkKind,
  x: number,
  z: number,
  scale = 1,
  rotation = 0,
): EnvironmentLandmark {
  return { kind, position: [x, 0, z], scale, rotation };
}

export const STAGE_ENVIRONMENTS: Record<StageEnvironmentId, StageEnvironmentDefinition> = {
  suburban: {
    id: "suburban",
    label: "Cloverwood Suburbs",
    landmark: landmark("windmill", 10.2, 10.6, 1.05),
    props: [
      prop("tree", 11.5, -19, 1.05),
      prop("tree", -9.9, -2.4, 0.9),
      prop("shrub", 10.4, -4.2, 0.9),
      prop("fence", -9.8, 11.2, 1),
      prop("hay-bale", 7.8, -1.8, 0.9),
      prop("shed", 9.9, 4.8, 0.9),
      prop("car", -8.9, 5.2, 0.82, 0.2),
      prop("tree", 12.2, 5.2, 0.85),
      prop("lamp", -13.1, 15.4, 0.72),
      prop("rock", 13.1, 15.4, 0.7),
    ],
  },
  orchard: {
    id: "orchard",
    label: "Amber Orchard",
    landmark: landmark("giant-tree", 10.5, 11, 1.15),
    props: [
      prop("tree", -9.5, -18.5, 0.9),
      prop("tree", -8.7, -2.8, 0.8),
      prop("tree", 11.2, -8.2, 0.85),
      prop("tree", 11.8, 2.8, 0.9),
      prop("hay-bale", -10.2, 9.5, 0.8),
      prop("hay-bale", 9.8, -1.8, 0.8),
      prop("fence", -11.2, 12.2, 0.95),
      prop("shed", 10.6, 7.6, 0.9),
      prop("tree", -13.1, 15.4, 0.82),
      prop("hay-bale", 13.1, 15.4, 0.7),
    ],
  },
  market: {
    id: "market",
    label: "Old Town Market",
    landmark: landmark("market-arcade", -10.6, 10.8, 1),
    props: [
      prop("shed", 10.6, -19.4, 0.95),
      prop("crate", 11.1, -8.8, 0.75),
      prop("barrel", -10.7, -5.7, 0.8),
      prop("crate", 9.4, 4.6, 0.72),
      prop("lamp", -11.2, 11.2, 0.9),
      prop("car", -10.8, -12.8, 0.75, -0.4),
      prop("car", 11.4, 8.6, 0.72, 0.3),
      prop("barrel", -9.2, 6.2, 0.72),
      prop("barrel", -13.1, 15.4, 0.68),
      prop("lamp", 13.1, 15.4, 0.72),
    ],
  },
  "rail-yard": {
    id: "rail-yard",
    label: "Copper Rail Yard",
    landmark: landmark("rail-signal", 10.5, 11, 1.1),
    props: [
      prop("container", -10.8, -18.8, 0.92),
      prop("container", 10.8, -10.5, 0.82),
      prop("barrier", -10.5, -2.1, 0.8, Math.PI / 2),
      prop("crate", 11.4, 4.5, 0.8),
      prop("lamp", -10.8, 8.8, 0.9),
      prop("barrel", 11.2, 12.5, 0.7),
      prop("container", -11.2, 13.1, 0.8),
      prop("shed", 7.7, 10.9, 0.82),
      prop("container", -13.1, 15.4, 0.65),
      prop("lamp", 13.1, 15.4, 0.72),
    ],
  },
  "river-checkpoint": {
    id: "river-checkpoint",
    label: "Willow River Checkpoint",
    landmark: landmark("water-tower", 10.3, 10.4, 1.05),
    props: [
      prop("tree", -11.3, -18.8, 0.92),
      prop("tree", 10.9, -12.2, 0.85),
      prop("rock", -10.9, -4.2, 0.9),
      prop("dock", 10.9, 3.6, 0.85),
      prop("barrel", -10.9, 8.8, 0.75),
      prop("shed", 9.6, 7.2, 0.82),
      prop("tree", -11.4, 13.1, 0.78),
      prop("rock", 9.2, 12.2, 0.8),
      prop("tree", -13.1, 15.4, 0.72),
      prop("rock", 13.1, 15.4, 0.68),
    ],
  },
  "jungle-ruins": {
    id: "jungle-ruins",
    label: "Verdant Ruins",
    landmark: landmark("jungle-gate", 10.6, 10.6, 1.05),
    props: [
      prop("palm", -11, -19, 1),
      prop("palm", 10.8, -11.6, 0.9),
      prop("palm", -10.8, -1.9, 0.9),
      prop("rock", 10.8, 4.4, 0.82),
      prop("shrub", -10.8, 8.8, 1),
      prop("palm", 9.9, 8.8, 0.9),
      prop("rock", 11.5, 13, 0.72),
      prop("palm", -13.1, 15.4, 0.72),
      prop("shrub", 13.2, -20.5, 0.8),
      prop("shrub", 13.1, 15.4, 0.9),
    ],
  },
  mangrove: {
    id: "mangrove",
    label: "Mirewater Mangrove",
    landmark: landmark("mangrove-shrine", -10.8, 10.6, 0.95),
    props: [
      prop("palm", -11.2, -18.6, 0.9),
      prop("dead-tree", 10.8, -13, 0.85),
      prop("rock", -10.6, -4.6, 0.82),
      prop("palm", 11, 1, 0.86),
      prop("dead-tree", -11.1, 5.2, 0.9),
      prop("dock", 10.8, 8.9, 0.84),
      prop("rock", -10.8, 12.8, 0.72),
      prop("palm", 9.5, 13, 0.75),
      prop("dead-tree", -13.1, 15.4, 0.72),
      prop("rock", 13.1, 15.4, 0.65),
    ],
  },
  redwood: {
    id: "redwood",
    label: "Ironwood Pass",
    landmark: landmark("redwood-giant", 10.6, 10.6, 1.05),
    props: [
      prop("pine", -11.2, -18.4, 1.1),
      prop("pine", 10.8, -11.8, 1),
      prop("pine", -10.9, -2.3, 1.05),
      prop("rock", 11, 2.9, 0.9),
      prop("pine", -11, 8.2, 1),
      prop("pine", 10.5, 12.2, 0.95),
      prop("shed", 9.2, 5.9, 0.8),
      prop("rock", -9.9, 13.1, 0.82),
      prop("pine", -13.1, 15.4, 0.72),
      prop("rock", 13.1, 15.4, 0.68),
    ],
  },
  "frozen-lab": {
    id: "frozen-lab",
    label: "Whiteglass Research Station",
    landmark: landmark("frozen-lab", 10.6, 10.6, 1.0),
    props: [
      prop("ice", -11.1, -19, 1.05),
      prop("container", 11.1, -11.8, 0.82),
      prop("ice", -10.8, -1.8, 0.9),
      prop("vent", 10.8, 1.8, 0.86),
      prop("crate", -10.8, 7.6, 0.8),
      prop("antenna", 10.2, 6.1, 0.82),
      prop("ice", -10.8, 13, 0.78),
      prop("container", 8.3, 12.5, 0.75),
      prop("ice", -13.1, 15.4, 0.72),
      prop("vent", 13.1, 15.4, 0.65),
    ],
  },
  "ice-cavern": {
    id: "ice-cavern",
    label: "Blueglass Cavern",
    landmark: landmark("ice-cave", 10.5, 10.4, 1.05),
    props: [
      prop("ice", -11.1, -19, 1.05),
      prop("crystal", 10.7, -12, 0.82),
      prop("ice", -10.8, -4.2, 0.9),
      prop("crystal", 11, 0.2, 0.86),
      prop("ice", -10.9, 6.1, 0.95),
      prop("crystal", 10.8, 7.4, 0.8),
      prop("ice", -10.4, 12.8, 0.8),
      prop("crystal", 8.4, 13.2, 0.72),
      prop("crystal", -13.1, 15.4, 0.62),
      prop("ice", 13.1, 15.4, 0.72),
    ],
  },
  harbor: {
    id: "harbor",
    label: "Stormbreak Harbor",
    landmark: landmark("lighthouse", 10.8, 10.8, 1.1),
    props: [
      prop("container", -11.1, -19, 0.86),
      prop("boat", 10.8, -12.8, 0.8, -0.2),
      prop("dock", -10.6, -4.2, 0.9),
      prop("barrel", 10.8, 2.3, 0.72),
      prop("container", -10.8, 7.6, 0.82),
      prop("crate", 11.2, 8.2, 0.7),
      prop("boat", -9.9, 12.2, 0.7, 0.5),
      prop("barrel", 8.5, 13, 0.7),
      prop("container", -13.1, 15.4, 0.62),
      prop("barrel", 13.1, 15.4, 0.68),
    ],
  },
  "desert-bazaar": {
    id: "desert-bazaar",
    label: "Sunscar Bazaar",
    landmark: landmark("oasis", 10.6, 10.7, 1.0),
    props: [
      prop("cactus", -11.1, -19, 0.92),
      prop("cactus", 11, -12.1, 0.82),
      prop("rock", -10.8, -3.7, 0.92),
      prop("cactus", 10.8, 1.4, 0.86),
      prop("shed", -10.9, 6.5, 0.82),
      prop("barrel", 10.9, 8.1, 0.72),
      prop("rock", -10.2, 12.7, 0.78),
      prop("cactus", 8.8, 13.1, 0.74),
      prop("cactus", -13.1, 15.4, 0.68),
      prop("rock", 13.1, 15.4, 0.7),
    ],
  },
  "redrock-canyon": {
    id: "redrock-canyon",
    label: "Redrock Narrows",
    landmark: landmark("canyon-bridge", 10.5, 10.8, 1.05, Math.PI / 2),
    props: [
      prop("boulder", -11.1, -19, 1.05),
      prop("rock", 11, -12.1, 0.95),
      prop("boulder", -10.8, -3.6, 0.9),
      prop("rock", 10.9, 1.8, 0.9),
      prop("boulder", -10.6, 7.2, 0.92),
      prop("rock", 11, 8.5, 0.8),
      prop("boulder", -10.1, 13, 0.82),
      prop("rock", 9, 13, 0.76),
      prop("boulder", -13.1, 15.4, 0.7),
      prop("rock", 13.1, 15.4, 0.68),
    ],
  },
  "deep-mine": {
    id: "deep-mine",
    label: "Blackvein Mine",
    landmark: landmark("mine-headframe", 10.5, 10.7, 1.0),
    props: [
      prop("mine-cart", -11, -19, 0.8),
      prop("ore", 10.8, -12.2, 0.82),
      prop("crate", -10.8, -2.7, 0.82),
      prop("ore", 10.8, 2.1, 0.85),
      prop("mine-cart", -10.6, 7.8, 0.76, 0.1),
      prop("barrel", 10.8, 8.8, 0.72),
      prop("ore", -10.2, 12.8, 0.78),
      prop("crate", 8.7, 13.2, 0.72),
      prop("ore", -13.1, 15.4, 0.7),
      prop("crate", 13.1, 15.4, 0.68),
    ],
  },
  "military-outpost": {
    id: "military-outpost",
    label: "Fort Ember",
    landmark: landmark("radar-dish", 10.3, 10.8, 1.0, -0.25),
    props: [
      prop("sandbag", -11.1, -19, 0.9),
      prop("barrier", 11, -12.2, 0.85),
      prop("crate", -10.8, -2.8, 0.82),
      prop("sandbag", 10.8, 1.8, 0.82),
      prop("shed", -10.8, 7.4, 0.82),
      prop("lamp", 10.6, 8.4, 0.8),
      prop("barrier", -10.2, 12.8, 0.78),
      prop("antenna", 8.7, 13, 0.76),
      prop("sandbag", -13.1, 15.4, 0.7),
      prop("barrier", 13.1, 15.4, 0.62),
    ],
  },
  "abandoned-city": {
    id: "abandoned-city",
    label: "Hollowpoint City",
    landmark: landmark("skyscraper", 10.2, 10.6, 1.05),
    props: [
      prop("car", -11, -19, 0.78, -0.25),
      prop("rubble", 10.7, -12.1, 0.85),
      prop("car", -10.8, -2.7, 0.75, 0.2),
      prop("rubble", 10.7, 2.3, 0.92),
      prop("car", -10.5, 7.5, 0.72, -0.3),
      prop("lamp", 10.5, 8.2, 0.85),
      prop("rubble", -10.2, 12.8, 0.84),
      prop("car", 8.8, 13, 0.7, 0.1),
      prop("car", -13.1, 15.4, 0.62),
      prop("rubble", 13.1, 15.4, 0.7),
    ],
  },
  foundry: {
    id: "foundry",
    label: "Ashline Foundry",
    landmark: landmark("foundry-furnace", 10.4, 10.7, 1.05),
    props: [
      prop("container", -11.1, -19, 0.9),
      prop("pipe", 11, -12.2, 0.9),
      prop("barrel", -10.7, -2.5, 0.75),
      prop("vent", 10.7, 2.2, 0.85),
      prop("container", -10.6, 7.5, 0.82),
      prop("pipe", 10.5, 8.3, 0.82),
      prop("barrel", -10.2, 12.7, 0.7),
      prop("crate", 8.8, 13, 0.7),
      prop("pipe", -13.1, 15.4, 0.68),
      prop("vent", 13.1, 15.4, 0.64),
    ],
  },
  graveyard: {
    id: "graveyard",
    label: "Hallowed Grounds",
    landmark: landmark("cathedral", 10.4, 10.7, 1.0),
    props: [
      prop("dead-tree", -11.2, -19, 0.92),
      prop("tombstone", 11, -12.2, 0.78),
      prop("dead-tree", -10.8, -2.5, 0.86),
      prop("tombstone", 10.8, 2.2, 0.82),
      prop("tombstone", -10.7, 7.7, 0.82),
      prop("dead-tree", 10.5, 8.3, 0.82),
      prop("tombstone", -10.1, 12.8, 0.76),
      prop("dead-tree", 8.7, 13, 0.74),
      prop("tombstone", -13.1, 15.4, 0.65),
      prop("dead-tree", 13.1, 15.4, 0.68),
    ],
  },
  volcano: {
    id: "volcano",
    label: "Cinderfall Caldera",
    landmark: landmark("volcano-crater", 10.2, 10.8, 1.08),
    props: [
      prop("boulder", -11.2, -19, 1.05),
      prop("boulder", 11, -12.2, 0.9),
      prop("boulder", -10.8, -2.5, 0.92),
      prop("rock", 10.8, 2.2, 0.82),
      prop("boulder", -10.7, 7.6, 0.88),
      prop("vent", 10.5, 8.4, 0.84),
      prop("boulder", -10.2, 12.8, 0.84),
      prop("boulder", 8.8, 13, 0.75),
      prop("boulder", -13.1, 15.4, 0.68),
      prop("vent", 13.1, 15.4, 0.64),
    ],
  },
  blacksite: {
    id: "blacksite",
    label: "Blacksite Omega",
    landmark: landmark("reactor", 10.2, 10.6, 1.05),
    props: [
      prop("barrier", -11.1, -19, 0.85),
      prop("vent", 11, -12.2, 0.85),
      prop("antenna", -10.7, -2.7, 0.82),
      prop("container", 10.7, 2.2, 0.82),
      prop("pipe", -10.6, 7.7, 0.86),
      prop("vent", 10.5, 8.4, 0.82),
      prop("barrier", -10.1, 12.8, 0.78),
      prop("antenna", 8.8, 13, 0.74),
      prop("antenna", -13.1, 15.4, 0.62),
      prop("barrier", 13.1, 15.4, 0.62),
    ],
  },
};

export function getStageEnvironment(environmentId: StageEnvironmentId) {
  return STAGE_ENVIRONMENTS[environmentId];
}
