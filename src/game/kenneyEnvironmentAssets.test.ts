import { describe, expect, test } from "bun:test";
import { getKenneyBuildingAsset, KENNEY_BUILDING_ASSETS } from "./kenneyEnvironmentAssets";

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
