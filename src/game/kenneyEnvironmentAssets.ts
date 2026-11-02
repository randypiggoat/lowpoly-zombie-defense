import type { StageEnvironmentId } from "./stageEnvironments";

export const KENNEY_BUILDING_ASSETS = {
  suburbanHouseA: {
    src: "/models/kenney/city-kit-suburban/building-type-a.glb",
    sourceHeight: 2,
  },
  suburbanHouseF: {
    src: "/models/kenney/city-kit-suburban/building-type-f.glb",
    sourceHeight: 2.1375,
  },
  citySkyscraperA: {
    src: "/models/kenney/city-kit-commercial/building-skyscraper-a.glb",
    sourceHeight: 3.88,
  },
  cityBuildingF: {
    src: "/models/kenney/city-kit-commercial/building-f.glb",
    sourceHeight: 2.693,
  },
} as const;

export type KenneyBuildingAssetId = keyof typeof KENNEY_BUILDING_ASSETS;

/**
 * Only replace authored obstacle buildings whose role and silhouette suit the
 * selected model. Walls, stalls, ruins and other map-specific landmarks retain
 * their purpose-built geometry.
 */
export function getKenneyBuildingAsset(
  environmentId: StageEnvironmentId,
  label: string,
): KenneyBuildingAssetId | null {
  const normalizedLabel = label.trim().toLowerCase();

  if (environmentId === "suburban") {
    if (normalizedLabel === "family house") return "suburbanHouseA";
    if (normalizedLabel === "garage") return "suburbanHouseF";
  }

  if (environmentId === "abandoned-city") {
    if (normalizedLabel === "apartment block" || normalizedLabel === "office block") {
      return "citySkyscraperA";
    }
    if (normalizedLabel === "parking deck" || normalizedLabel === "collapsed storefront") {
      return "cityBuildingF";
    }
  }

  return null;
}
