import { describe, expect, test } from "bun:test";
import {
  getKenneyBuildingAsset,
  getKenneyGravestoneAsset,
  KENNEY_BUILDING_ASSETS,
  KENNEY_GRAVEYARD_ASSETS,
} from "./kenneyEnvironmentAssets";

describe("Kenney environment building selection", () => {
  test("uses CC0 house models for the two authored suburban structures", () => {
    expect(getKenneyBuildingAsset("suburban", "Family house")).toBe("suburbanHouseA");
    expect(getKenneyBuildingAsset("suburban", "Garage")).toBe("suburbanHouseF");
  });

  test("gives abandoned-city skyline buildings two distinct silhouettes", () => {
    expect(getKenneyBuildingAsset("abandoned-city", "Apartment block")).toBe("citySkyscraperA");
    expect(getKenneyBuildingAsset("abandoned-city", "Office block")).toBe("citySkyscraperA");
    expect(getKenneyBuildingAsset("abandoned-city", "Parking deck")).toBe("cityBuildingF");
    expect(getKenneyBuildingAsset("abandoned-city", "Collapsed storefront")).toBe("cityBuildingF");
  });

  test("leaves unrelated structures and all other biomes on their authored geometry", () => {
    expect(getKenneyBuildingAsset("suburban", "Garden wall")).toBeNull();
    expect(getKenneyBuildingAsset("market", "Family house")).toBeNull();
    expect(getKenneyBuildingAsset("foundry", "Warehouse")).toBeNull();
    expect(getKenneyBuildingAsset("graveyard", "Chapel")).toBeNull();
  });

  test("records positive measured GLB heights for local runtime transforms", () => {
    for (const asset of Object.values(KENNEY_BUILDING_ASSETS)) {
      expect(asset.sourceHeight).toBeGreaterThan(0);
      expect(asset.src.startsWith("/models/kenney/")).toBe(true);
    }
  });
});

describe("Kenney graveyard asset selection", () => {
  test("cycles through three distinct gravestone silhouettes deterministically", () => {
    expect([0, 1, 2, 3, 4, 5].map(getKenneyGravestoneAsset)).toEqual([
      "gravestoneCross",
      "gravestoneBevel",
      "gravestoneBroken",
      "gravestoneCross",
      "gravestoneBevel",
      "gravestoneBroken",
    ]);
  });

  test("includes a separate crypt asset for the cemetery's mausoleum prop", () => {
    expect(KENNEY_GRAVEYARD_ASSETS.cryptSmall.src).toBe(
      "/models/kenney/graveyard-kit/crypt-small.glb",
    );
    expect(KENNEY_GRAVEYARD_ASSETS.cryptSmall.sourceHeight).toBeGreaterThan(0);
  });

  test("all selected graveyard models use local, measured GLB metadata", () => {
    for (const asset of Object.values(KENNEY_GRAVEYARD_ASSETS)) {
      expect(asset.sourceHeight).toBeGreaterThan(0);
      expect(asset.src.startsWith("/models/kenney/graveyard-kit/")).toBe(true);
    }
  });
});
