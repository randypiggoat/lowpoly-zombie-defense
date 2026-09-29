import { describe, expect, test } from "bun:test";
import {
  STAGE_MAPS,
  canPlaceTower,
  getPathLength,
  pathCoverageRatio,
  snapBuildPosition,
} from "./maps";

describe("stage maps", () => {
  test("campaign maps expose distinct routes", () => {
    const lengths = Object.values(STAGE_MAPS).map((map) => getPathLength(map.path));
    expect(new Set(lengths).size).toBeGreaterThan(1);
    expect(STAGE_MAPS.neighborhood.path).not.toEqual(STAGE_MAPS.highway.path);
  });

  test("placement rejects roads and accepts open ground", () => {
    const map = STAGE_MAPS.neighborhood;
    const road = map.path[1]!;
    expect(canPlaceTower(map, road.x, road.z).valid).toBe(false);
    expect(canPlaceTower(map, 0, -22).valid).toBe(true);
  });

  test("placement snaps to half-unit coordinates", () => {
    const snapped = snapBuildPosition(STAGE_MAPS.neighborhood, 0.24, -21.76);
    expect(snapped).toEqual({ x: 0, z: -21.5 });
  });

  test("path coverage measures why placement location matters", () => {
    const map = STAGE_MAPS.highway;
    const shortRange = pathCoverageRatio(map, 4, 5, 4.3);
    const longRange = pathCoverageRatio(map, 4, 5, 14);
    expect(longRange).toBeGreaterThan(shortRange);
    expect(longRange).toBeLessThanOrEqual(1);
  });
});
