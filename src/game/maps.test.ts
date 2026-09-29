import { describe, expect, test } from "bun:test";
import {
  STAGE_MAPS,
  canPlaceTower,
  getStageMapByStageId,
  getPathLength,
  pathCoverageRatio,
  snapBuildPosition,
} from "./maps";

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

  test("placement rejects roads and accepts open ground", () => {
    const map = STAGE_MAPS.neighborhood;
    const road = map.path[1]!;
    expect(canPlaceTower(map, road.x, road.z).valid).toBe(false);
    expect(canPlaceTower(map, 0, -22).valid).toBe(true);
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
});
