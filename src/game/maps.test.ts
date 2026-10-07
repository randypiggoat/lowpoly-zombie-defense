import { describe, expect, test } from "bun:test";
import {
  STAGE_MAPS,
  canPlaceTower,
  getStageMapByStageId,
  getPathLength,
  getPathDirectionAtDistance,
  pointAtPath,
  samplePathAtDistance,
  pathCoverageRatio,
  snapBuildPosition,
} from "./maps";


function segmentIntersectsRect(
  a: { x: number; z: number },
  b: { x: number; z: number },
  rect: { x: number; z: number; width: number; depth: number },
  padding = 0.05,
) {
  const minX = rect.x - rect.width / 2 - padding;
  const maxX = rect.x + rect.width / 2 + padding;
  const minZ = rect.z - rect.depth / 2 - padding;
  const maxZ = rect.z + rect.depth / 2 + padding;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  let tMin = 0;
  let tMax = 1;
  for (const [origin, delta, min, max] of [[a.x, dx, minX, maxX], [a.z, dz, minZ, maxZ]] as const) {
    if (Math.abs(delta) < 0.000001) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let t1 = (min - origin) / delta;
    let t2 = (max - origin) / delta;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

describe("stage maps", () => {
  test("campaign exposes twenty distinct map environments", () => {
    const maps = Object.values(STAGE_MAPS);
    expect(maps).toHaveLength(20);
    expect(new Set(maps.map((map) => map.environmentId)).size).toBe(20);
    expect(new Set(maps.map((map) => getPathLength(map.path))).size).toBeGreaterThan(10);
  });

  test("every stage id resolves to a unique playable map", () => {
    const resolved = Array.from({ length: 20 }, (_, index) => getStageMapByStageId(index + 1));
    expect(new Set(resolved.map((map) => map.id)).size).toBe(20);
    for (const map of resolved) {
      expect(map.path.length).toBeGreaterThanOrEqual(4);
      expect(getPathLength(map.path)).toBeGreaterThan(0);
      expect(map.path.every((point) =>
        point.x >= map.bounds.minX &&
        point.x <= map.bounds.maxX &&
        point.z >= map.bounds.minZ &&
        point.z <= map.bounds.maxZ,
      )).toBe(true);
    }
  });

  test("precomputed path directions match route segments", () => {
    const map = STAGE_MAPS.neighborhood;
    const firstSegmentLength = getPathLength([map.path[0]!, map.path[1]!]);
    expect(getPathDirectionAtDistance(map.path, firstSegmentLength + 0.6)).toBeCloseTo(Math.PI / 2, 12);
    expect(getPathDirectionAtDistance(map.path, 0.6)).toBeCloseTo(0, 12);
  });

  test("path sampling matches point and direction APIs at route corners", () => {
    const map = STAGE_MAPS.neighborhood;
    const first = pointAtPath(map.path, 3.5);
    const sampled = samplePathAtDistance(map.path, 3.5);
    expect(sampled.x).toBeCloseTo(first.x, 12);
    expect(sampled.z).toBeCloseTo(first.z, 12);
    expect(sampled.direction).toBeCloseTo(
      getPathDirectionAtDistance(map.path, 3.5),
      12,
    );

    const firstSegmentLength = getPathLength([map.path[0]!, map.path[1]!]);
    const corner = samplePathAtDistance(map.path, firstSegmentLength + 0.01);
    expect(corner.x).toBeCloseTo(map.path[1]!.x + 0.01, 12);
    expect(corner.z).toBeCloseTo(map.path[1]!.z, 12);
    expect(corner.direction).toBeCloseTo(Math.PI / 2, 12);
  });

  test("placement rejects roads and accepts open ground", () => {
    const map = STAGE_MAPS.neighborhood;
    const road = map.path[1]!;
    expect(canPlaceTower(map, road.x, road.z).valid).toBe(false);
    expect(canPlaceTower(map, 0, -22).valid).toBe(true);
  });

  test("blocked terrain rejects tower placement on frozen maps", () => {
    const frozenLab = STAGE_MAPS["frozen-lab"];
    const cavern = STAGE_MAPS["ice-cavern"];
    expect(frozenLab.blockedZones?.length).toBeGreaterThan(0);
    expect(cavern.blockedZones?.length).toBeGreaterThan(0);
    const labZone = frozenLab.blockedZones![0]!;
    const cavernZone = cavern.blockedZones![0]!;
    expect(canPlaceTower(frozenLab, labZone.x, labZone.z).reason).toBe("blocked-terrain");
    expect(canPlaceTower(cavern, cavernZone.x, cavernZone.z).reason).toBe("blocked-terrain");
  });

  test("placement snaps to half-unit coordinates", () => {
    const snapped = snapBuildPosition(STAGE_MAPS.neighborhood, 0.24, -21.24);
    expect(snapped).toEqual({ x: 0, z: -21 });
  });

  test("path coverage measures why placement location matters", () => {
    const map = STAGE_MAPS["redrock-canyon"];
    const shortRange = pathCoverageRatio(map, 4, 5, 4.3);
    const longRange = pathCoverageRatio(map, 4, 5, 14);
    expect(longRange).toBeGreaterThan(shortRange);
    expect(longRange).toBeLessThanOrEqual(1);
  });

  test("every authored route stays outside its blockers", () => {
    for (const map of Object.values(STAGE_MAPS)) {
      for (let i = 1; i < map.path.length; i++) {
        for (const obstacle of map.obstacles) {
          expect(segmentIntersectsRect(map.path[i - 1]!, map.path[i]!, obstacle)).toBe(false);
        }
      }
    }
  });

  test("campaign routes use multiple tactical silhouettes", () => {
    const directions = new Set<string>();
    const widths = new Set<number>();
    for (const map of Object.values(STAGE_MAPS)) {
      widths.add(map.pathWidth);
      for (let i = 1; i < map.path.length; i++) {
        const dx = map.path[i]!.x - map.path[i - 1]!.x;
        const dz = map.path[i]!.z - map.path[i - 1]!.z;
        directions.add((dx === 0 ? 0 : dx > 0 ? 1 : -1) + "," + (dz === 0 ? 0 : dz > 0 ? 1 : -1));
      }
    }
    expect(widths.size).toBeGreaterThanOrEqual(6);
    expect(directions.size).toBeGreaterThanOrEqual(5);
  });
});
