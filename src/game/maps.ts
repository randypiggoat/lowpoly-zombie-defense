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
  | "gas-station"
  | "shopping-center"
  | "police-station"
  | "highway";

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
  },
  "gas-station": {
    id: "gas-station",
    name: "Gas Station",
    path: [
      { x: -11, z: -22 },
      { x: -11, z: -15 },
      { x: 10, z: -15 },
      { x: 10, z: -8 },
      { x: -4, z: -8 },
      { x: -4, z: -2 },
      { x: 11, z: -2 },
      { x: 11, z: 5 },
      { x: -9, z: 5 },
      { x: -9, z: 10 },
      { x: -4, z: 10 },
      { x: -4, z: 13.8 },
    ],
    pathWidth: 2.8,
    base: { x: -4, z: 13.8 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 0, z: -11.7, width: 6.8, depth: 2.5, height: 1.2, label: "Fuel canopy" },
      { x: -9.2, z: -8.5, width: 3.2, depth: 3.8, height: 1.05, label: "Station shop" },
      { x: 7.4, z: 4.4, width: 3.2, depth: 2.6, height: 0.82, label: "Pump island" },
    ],
    placementTip: "The canopy creates a real sightline puzzle: outer positions see the straights, while inside corners dominate the returns.",
  },
  "shopping-center": {
    id: "shopping-center",
    name: "Shopping Center",
    path: [
      { x: -12, z: -22 },
      { x: -12, z: -17 },
      { x: 7, z: -17 },
      { x: 7, z: -11 },
      { x: -7, z: -11 },
      { x: -7, z: -4 },
      { x: 9, z: -4 },
      { x: 9, z: 3 },
      { x: -3, z: 3 },
      { x: -3, z: 9 },
      { x: 10, z: 9 },
      { x: 10, z: 12 },
      { x: -4, z: 12 },
      { x: -4, z: 14.2 },
    ],
    pathWidth: 2.8,
    base: { x: -4, z: 14.2 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.85,
    towerClearance: 1.55,
    obstacles: [
      { x: 9.2, z: -14.5, width: 3.6, depth: 3.2, height: 1.1, label: "Anchor storefront" },
      { x: -10, z: -1, width: 3.5, depth: 3.8, height: 1.05, label: "Corner storefront" },
      { x: 4.2, z: 7.1, width: 4.2, depth: 2.9, height: 0.95, label: "Food court kiosk" },
    ],
    placementTip: "Alternating parking-lot bends create several high-value pockets; blockers split the map into short tactical sightlines.",
  },
  "police-station": {
    id: "police-station",
    name: "Police Station",
    path: [
      { x: -11, z: -22 },
      { x: -11, z: -14 },
      { x: 4, z: -14 },
      { x: 4, z: -8 },
      { x: -8, z: -8 },
      { x: -8, z: -1 },
      { x: 8, z: -1 },
      { x: 8, z: 5 },
      { x: -2, z: 5 },
      { x: -2, z: 10 },
      { x: 9, z: 10 },
      { x: 9, z: 12 },
      { x: -4, z: 12 },
      { x: -4, z: 14.5 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 14.5 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.9,
    towerClearance: 1.6,
    obstacles: [
      { x: -4.2, z: -18, width: 5.8, depth: 3.8, height: 1.35, label: "Police station" },
      { x: 6.2, z: -6.9, width: 3.4, depth: 3.1, height: 1.0, label: "Impound garage" },
      { x: 4.7, z: 13.1, width: 4.4, depth: 2.3, height: 0.82, label: "Evidence yard" },
    ],
    placementTip: "The central courtyard gives broad coverage, but the station and impound buildings create deliberate blind pockets for specialized towers.",
  },
  "highway": {
    id: "highway",
    name: "Highway",
    path: [
      { x: -12, z: -22 },
      { x: -12, z: -18 },
      { x: 10, z: -18 },
      { x: 10, z: -12 },
      { x: -4, z: -12 },
      { x: -4, z: -5 },
      { x: 11, z: -5 },
      { x: 11, z: 2 },
      { x: -9, z: 2 },
      { x: -9, z: 8 },
      { x: 5, z: 8 },
      { x: 5, z: 13 },
      { x: -1, z: 15 },
      { x: -4, z: 15.8 },
    ],
    pathWidth: 2.9,
    base: { x: -4, z: 15.8 },
    bounds: COMMON_BOUNDS,
    buildClearance: 1.95,
    towerClearance: 1.6,
    obstacles: [
      { x: -7.2, z: -15.1, width: 4.2, depth: 2.6, height: 0.82, label: "Concrete median" },
      { x: 7.2, z: -1.2, width: 4.2, depth: 2.7, height: 0.82, label: "Jersey barrier" },
      { x: -5.6, z: 6.1, width: 4.1, depth: 3.0, height: 0.9, label: "Road service depot" },
    ],
    placementTip: "Long highway sightlines reward precision towers, while barriers create small pockets where splash and slowing become valuable.",
  },
};

export function getStageMap(mapId?: StageMapId | null) {
  return STAGE_MAPS[mapId ?? "highway"] ?? STAGE_MAPS.highway;
}

export function getStageMapByStageId(stageId: number) {
  switch (stageId) {
    case 1:
      return STAGE_MAPS.neighborhood;
    case 2:
      return STAGE_MAPS["gas-station"];
    case 3:
      return STAGE_MAPS["shopping-center"];
    case 4:
      return STAGE_MAPS["police-station"];
    case 5:
    default:
      return STAGE_MAPS.highway;
  }
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

function segmentIntersectsRect(
  from: MapVec2,
  to: MapVec2,
  rect: MapRect,
  padding = 0.05,
) {
  const minX = rect.x - rect.width / 2 - padding;
  const maxX = rect.x + rect.width / 2 + padding;
  const minZ = rect.z - rect.depth / 2 - padding;
  const maxZ = rect.z + rect.depth / 2 + padding;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  let tMin = 0;
  let tMax = 1;

  const axis = (origin: number, delta: number, min: number, max: number) => {
    if (Math.abs(delta) < 0.000001) return origin >= min && origin <= max;
    const inv = 1 / delta;
    let t1 = (min - origin) * inv;
    let t2 = (max - origin) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    return tMin <= tMax;
  };

  return axis(from.x, dx, minX, maxX) && axis(from.z, dz, minZ, maxZ);
}

export function hasLineOfSight(map: StageMap, from: MapVec2, to: MapVec2) {
  return !map.obstacles.some((obstacle) => segmentIntersectsRect(from, to, obstacle));
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
    if (
      Math.hypot(point.x - x, point.z - z) <= range &&
      hasLineOfSight(map, { x, z }, point)
    ) {
      covered += sampleStep;
    }
  }
  return Math.min(1, covered / total);
}
