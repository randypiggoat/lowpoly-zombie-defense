import { describe, expect, test } from "bun:test";
import { STAGE_MAPS } from "./maps";
import { getEnvironmentArtTone } from "./environmentVisuals";
import {
  composeMapEnvironment,
  createAmbientScenery,
  createTerrainAccents,
  getEnvironmentLandmarkRadius,
  getEnvironmentPropRadius,
  isMapEnvironmentPlacementClear,
} from "./mapScenery";

describe("map environment composition", () => {
  test("every map has a unique, valid material tone for environmental props", () => {
    const tones = Object.values(STAGE_MAPS).map((map) => getEnvironmentArtTone(map.environmentId));
    expect(tones).toHaveLength(20);
    expect(new Set(tones).size).toBe(20);
    for (const tone of tones) expect(tone).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("all twenty environments have deterministic, safely placed authored assets", () => {
    for (const map of Object.values(STAGE_MAPS)) {
      const first = composeMapEnvironment(map);
      const second = composeMapEnvironment(map);
      expect(first).toEqual(second);
      expect(first.id).toBe(map.environmentId);
      expect(first.props.length).toBeGreaterThan(0);

      const occupied: Array<{ x: number; z: number; radius: number }> = [];
      const landmarkX = first.landmark.position[0];
      const landmarkZ = first.landmark.position[2];
      const landmarkRadius = getEnvironmentLandmarkRadius(first.landmark);

      expect(
        isMapEnvironmentPlacementClear(map, landmarkX, landmarkZ, landmarkRadius, occupied),
      ).toBe(true);
      occupied.push({ x: landmarkX, z: landmarkZ, radius: landmarkRadius });

      for (const item of first.props) {
        const x = item.position[0];
        const z = item.position[2];
        const radius = getEnvironmentPropRadius(item);
        expect(isMapEnvironmentPlacementClear(map, x, z, radius, occupied)).toBe(true);
        occupied.push({ x, z, radius });
      }
    }
  });

  test("ambient props use stable but map-specific layouts", () => {
    const maps = Object.values(STAGE_MAPS);
    const signatures = new Set<string>();

    for (const map of maps) {
      const layout = composeMapEnvironment(map);
      const first = createAmbientScenery(map, 22, layout);
      const second = createAmbientScenery(map, 22, layout);
      expect(first).toEqual(second);

      const signature = first
        .map((item) => `${item.kind}:${item.position[0].toFixed(2)}:${item.position[2].toFixed(2)}`)
        .join("|");
      signatures.add(signature);

      const occupied = [
        ...layout.props.map((item) => ({
          x: item.position[0],
          z: item.position[2],
          radius: getEnvironmentPropRadius(item),
        })),
        {
          x: layout.landmark.position[0],
          z: layout.landmark.position[2],
          radius: getEnvironmentLandmarkRadius(layout.landmark),
        },
      ];

      for (const item of first) {
        const x = item.position[0];
        const z = item.position[2];
        const radius = getEnvironmentPropRadius(item);
        expect(isMapEnvironmentPlacementClear(map, x, z, radius, occupied)).toBe(true);
        occupied.push({ x, z, radius });
      }
    }

    expect(signatures.size).toBeGreaterThan(15);
  });

  test("terrain accents avoid routes, obstacles, blocked ground, and other accents", () => {
    for (const map of Object.values(STAGE_MAPS)) {
      const layout = composeMapEnvironment(map);
      const accents = createTerrainAccents(map, 18, layout);
      expect(accents).toEqual(createTerrainAccents(map, 18, layout));

      const occupied = [
        ...layout.props.map((item) => ({
          x: item.position[0],
          z: item.position[2],
          radius: getEnvironmentPropRadius(item),
        })),
        {
          x: layout.landmark.position[0],
          z: layout.landmark.position[2],
          radius: getEnvironmentLandmarkRadius(layout.landmark),
        },
      ];

      for (const accent of accents) {
        expect(
          isMapEnvironmentPlacementClear(
            map,
            accent.x,
            accent.z,
            accent.radius,
            occupied,
            0.82,
          ),
        ).toBe(true);
        occupied.push({ x: accent.x, z: accent.z, radius: accent.radius });
      }
    }
  });
});
