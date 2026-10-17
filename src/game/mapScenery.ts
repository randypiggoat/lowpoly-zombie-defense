import { distanceToPath, insideRect, type StageMap, type MapVec2 } from "./maps";
import { getEnvironmentVisualProfile } from "./environmentVisuals";
import {
  getStageEnvironment,
  type EnvironmentLandmark,
  type EnvironmentLandmarkKind,
  type EnvironmentProp,
  type EnvironmentPropKind,
  type StageEnvironmentDefinition,
} from "./stageEnvironments";

export type OccupiedEnvironmentFootprint = {
  x: number;
  z: number;
  radius: number;
};

export type TerrainAccent = {
  x: number;
  z: number;
  radius: number;
  rotation: number;
  variant: number;
};

const PROP_RADII: Record<EnvironmentPropKind, number> = {
  tree: 1.12,
  pine: 1.05,
  palm: 0.92,
  "dead-tree": 0.88,
  rock: 0.68,
  boulder: 0.95,
  cactus: 0.56,
  shrub: 0.55,
  crate: 0.56,
  barrel: 0.48,
  fence: 0.86,
  lamp: 0.32,
  car: 1.18,
  container: 1.18,
  ice: 0.78,
  crystal: 0.52,
  dock: 1.12,
  boat: 0.95,
  "mine-cart": 0.78,
  ore: 0.72,
  sandbag: 0.84,
  tombstone: 0.42,
  rubble: 0.64,
  pipe: 0.8,
  vent: 0.5,
  antenna: 0.48,
  barrier: 1.05,
  "hay-bale": 0.56,
  shed: 1.02,
  igloo: 1.08,
};

const LANDMARK_RADII: Record<EnvironmentLandmarkKind, number> = {
  windmill: 1.28,
  "giant-tree": 2.05,
  "market-arcade": 2.25,
  "rail-signal": 0.55,
  "water-tower": 1.48,
  "jungle-gate": 1.75,
  "mangrove-shrine": 1.28,
  "redwood-giant": 2.12,
  "frozen-lab": 1.78,
  "ice-cave": 2.12,
  lighthouse: 1.28,
  oasis: 2.05,
  "canyon-bridge": 2.25,
  "mine-headframe": 1.56,
  "radar-dish": 0.95,
  skyscraper: 1.68,
  "foundry-furnace": 1.62,
  cathedral: 1.8,
  "volcano-crater": 2.22,
  reactor: 1.65,
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(initialSeed: number) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function getEnvironmentPropRadius(item: EnvironmentProp) {
  return PROP_RADII[item.kind] * item.scale;
}

export function getEnvironmentLandmarkRadius(item: EnvironmentLandmark) {
  return LANDMARK_RADII[item.kind] * item.scale;
}

function isInsideBounds(map: StageMap, x: number, z: number, radius: number) {
  const padding = 0.25 + radius * 0.34;
  return (
    x >= map.bounds.minX + padding &&
    x <= map.bounds.maxX - padding &&
    z >= map.bounds.minZ + padding &&
    z <= map.bounds.maxZ - padding
  );
}

/**
 * Shared placement guard for map scenery and low-poly terrain accents.
 * It affects visual placement only; tower targeting and build rules remain owned by maps.ts.
 */
export function isMapEnvironmentPlacementClear(
  map: StageMap,
  x: number,
  z: number,
  radius: number,
  occupied: readonly OccupiedEnvironmentFootprint[] = [],
  roadRadiusFactor = 1,
) {
  const point: MapVec2 = { x, z };
  if (!isInsideBounds(map, x, z, radius)) return false;

  const roadClearance = map.pathWidth / 2 + 0.62 + radius * roadRadiusFactor;
  if (distanceToPath(map, point) < roadClearance) return false;

  if (Math.hypot(x - map.base.x, z - map.base.z) < 4.0 + radius * 0.24) {
    return false;
  }

  if (map.obstacles.some((obstacle) => insideRect(point, obstacle, 0.18 + radius * 0.9))) {
    return false;
  }

  if ((map.blockedZones ?? []).some((zone) => insideRect(point, zone, 0.12 + radius * 0.8))) {
    return false;
  }

  return !occupied.some((asset) => {
    const clearance = radius * 0.55 + asset.radius * 0.55 + 0.3;
    return Math.hypot(x - asset.x, z - asset.z) < clearance;
  });
}

function findSafePosition(
  map: StageMap,
  start: MapVec2,
  radius: number,
  occupied: readonly OccupiedEnvironmentFootprint[],
  roadRadiusFactor = 0.36,
): MapVec2 | null {
  if (isMapEnvironmentPlacementClear(map, start.x, start.z, radius, occupied, roadRadiusFactor)) {
    return start;
  }

  const centerX = (map.bounds.minX + map.bounds.maxX) / 2;
  const centerZ = (map.bounds.minZ + map.bounds.maxZ) / 2;
  const outwardAngle = Math.atan2(start.z - centerZ, start.x - centerX);

  for (let ring = 0.5; ring <= 7.5; ring += 0.5) {
    for (let sector = 0; sector < 16; sector++) {
      const angle = outwardAngle + (sector * Math.PI * 2) / 16;
      const x = start.x + Math.cos(angle) * ring;
      const z = start.z + Math.sin(angle) * ring;
      if (isMapEnvironmentPlacementClear(map, x, z, radius, occupied, roadRadiusFactor)) {
        return { x, z };
      }
    }
  }

  return null;
}

function toFootprint(item: EnvironmentProp | EnvironmentLandmark): OccupiedEnvironmentFootprint {
  return {
    x: item.position[0],
    z: item.position[2],
    radius: "kind" in item && item.kind in PROP_RADII
      ? getEnvironmentPropRadius(item as EnvironmentProp)
      : getEnvironmentLandmarkRadius(item as EnvironmentLandmark),
  };
}

/**
 * Preserve authored assets and their themes, but nudge any that collide with roads,
 * map obstacles, blocked terrain, map edges, the base, or each other into the nearest
 * clear space. A different deterministic layout is produced for each authored map.
 */
export function composeMapEnvironment(map: StageMap): StageEnvironmentDefinition {
  const source = getStageEnvironment(map.environmentId);
  const occupied: OccupiedEnvironmentFootprint[] = [];
  const sourceLandmark = source.landmark;
  const landmarkRadius = getEnvironmentLandmarkRadius(sourceLandmark);
  const landmarkStart = { x: sourceLandmark.position[0], z: sourceLandmark.position[2] };
  const landmarkPosition =
    findSafePosition(map, landmarkStart, landmarkRadius, occupied) ?? landmarkStart;
  const landmark: EnvironmentLandmark = {
    ...sourceLandmark,
    position: [landmarkPosition.x, 0, landmarkPosition.z],
  };
  occupied.push(toFootprint(landmark));

  const props: EnvironmentProp[] = [];
  for (const sourceProp of source.props) {
    const radius = getEnvironmentPropRadius(sourceProp);
    const start = { x: sourceProp.position[0], z: sourceProp.position[2] };
    const position = findSafePosition(map, start, radius, occupied);
    if (!position) continue;

    const placed: EnvironmentProp = {
      ...sourceProp,
      position: [position.x, 0, position.z],
    };
    props.push(placed);
    occupied.push(toFootprint(placed));
  }

  return { ...source, landmark, props };
}

function createAmbientAnchors(map: StageMap) {
  const anchors: MapVec2[] = [];
  const { minX, maxX, minZ, maxZ } = map.bounds;
  const width = maxX - minX;
  const depth = maxZ - minZ;

  for (const fraction of [0.13, 0.3, 0.47, 0.64, 0.81, 0.94]) {
    const z = minZ + depth * fraction;
    anchors.push({ x: minX + 1.45, z }, { x: maxX - 1.45, z });
  }
  for (const fraction of [0.18, 0.39, 0.61, 0.82]) {
    const x = minX + width * fraction;
    anchors.push({ x, z: minZ + 1.55 }, { x, z: maxZ - 1.55 });
  }

  for (const obstacle of map.obstacles) {
    const gapX = obstacle.width / 2 + 1.65;
    const gapZ = obstacle.depth / 2 + 1.65;
    anchors.push(
      { x: obstacle.x - gapX, z: obstacle.z },
      { x: obstacle.x + gapX, z: obstacle.z },
      { x: obstacle.x, z: obstacle.z - gapZ },
      { x: obstacle.x, z: obstacle.z + gapZ },
    );
  }

  return anchors.filter((anchor) =>
    anchor.x >= minX + 0.6 &&
    anchor.x <= maxX - 0.6 &&
    anchor.z >= minZ + 0.6 &&
    anchor.z <= maxZ - 0.6,
  );
}

/**
 * Adds restrained clusters of theme-appropriate props along the map's open perimeter
 * and around authored landmarks. Layouts are stable per map and avoid road/building
 * collisions; these props remain decorative and do not create hidden gameplay blockers.
 */
export function createAmbientScenery(
  map: StageMap,
  count: number,
  layout: StageEnvironmentDefinition = composeMapEnvironment(map),
): EnvironmentProp[] {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return [];

  const kinds = getEnvironmentVisualProfile(map.environmentId).ambientKinds;
  if (kinds.length === 0) return [];

  const random = seededRandom(hashSeed(map.id + ":ambient"));
  const anchors = createAmbientAnchors(map);
  const occupied = layout.props.map(toFootprint);
  occupied.push(toFootprint(layout.landmark));
  const result: EnvironmentProp[] = [];
  const attempts = Math.max(240, safeCount * 64);

  for (let attempt = 0; attempt < attempts && result.length < safeCount; attempt++) {
    const anchor = anchors[Math.floor(random() * anchors.length)];
    if (!anchor) break;

    const x = anchor.x + (random() - 0.5) * 2.6;
    const z = anchor.z + (random() - 0.5) * 2.6;
    const kind = kinds[Math.floor(random() * kinds.length)]!;
    const scale = 0.56 + random() * 0.34;
    const candidate: EnvironmentProp = {
      kind,
      position: [x, 0, z],
      scale,
      rotation: random() * Math.PI * 2,
    };
    const radius = getEnvironmentPropRadius(candidate);
    if (!isMapEnvironmentPlacementClear(map, x, z, radius, occupied)) continue;

    result.push(candidate);
    occupied.push({ x, z, radius });
  }

  return result;
}

/**
 * Sparse faceted ground accents break up large flat areas without crossing the route,
 * sitting on blocked terrain, or covering the base and major props.
 */
export function createTerrainAccents(
  map: StageMap,
  count = 18,
  layout: StageEnvironmentDefinition = composeMapEnvironment(map),
): TerrainAccent[] {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return [];

  const random = seededRandom(hashSeed(map.id + ":terrain"));
  const occupied = layout.props.map(toFootprint);
  occupied.push(toFootprint(layout.landmark));
  const result: TerrainAccent[] = [];
  const { minX, maxX, minZ, maxZ } = map.bounds;

  for (
    let attempt = 0;
    attempt < Math.max(300, safeCount * 80) && result.length < safeCount;
    attempt++
  ) {
    const radius = 1.0 + random() * 1.05;
    const x = minX + radius + random() * (maxX - minX - radius * 2);
    const z = minZ + radius + random() * (maxZ - minZ - radius * 2);
    if (!isMapEnvironmentPlacementClear(map, x, z, radius, occupied, 0.82)) continue;

    result.push({
      x,
      z,
      radius,
      rotation: random() * Math.PI * 2,
      variant: result.length % 3,
    });
    occupied.push({ x, z, radius });
  }

  return result;
}
