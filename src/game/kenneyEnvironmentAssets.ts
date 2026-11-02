import type { EnvironmentPropKind, StageEnvironmentId } from "./stageEnvironments";

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

export const KENNEY_GRAVEYARD_ASSETS = {
  gravestoneCross: {
    src: "/models/kenney/graveyard-kit/gravestone-cross.glb",
    sourceHeight: 2,
  },
  gravestoneBevel: {
    src: "/models/kenney/graveyard-kit/gravestone-bevel.glb",
    sourceHeight: 2,
  },
  gravestoneBroken: {
    src: "/models/kenney/graveyard-kit/gravestone-broken.glb",
    sourceHeight: 2,
  },
  cryptSmall: {
    src: "/models/kenney/graveyard-kit/crypt-small.glb",
    sourceHeight: 2,
  },
} as const;

export type KenneyGraveyardAssetId = keyof typeof KENNEY_GRAVEYARD_ASSETS;

export function getKenneyGravestoneAsset(index: number): Exclude<KenneyGraveyardAssetId, "cryptSmall"> {
  const variants = ["gravestoneCross", "gravestoneBevel", "gravestoneBroken"] as const;
  const safeIndex = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return variants[safeIndex % variants.length]!;
}

export const KENNEY_NATURE_ASSETS = {
  treeOak: {
    src: "/models/kenney/nature-kit/tree-oak.glb",
    sourceWidth: 0.640554,
    sourceDepth: 0.739648,
    sourceHeight: 1.22623992,
    sourceMinY: 0,
    width: 1.5,
    depth: 1.5,
    height: 3,
  },
  pineTall: {
    src: "/models/kenney/nature-kit/tree-pinetalla-detailed.glb",
    sourceWidth: 0.386272922,
    sourceDepth: 0.39195,
    sourceHeight: 1.529606,
    sourceMinY: 0,
    width: 1.25,
    depth: 1.25,
    height: 3.8,
  },
  palmTall: {
    src: "/models/kenney/nature-kit/tree-palmdetailedtall.glb",
    sourceWidth: 1.034329,
    sourceDepth: 1.034329,
    sourceHeight: 1.247613,
    sourceMinY: 0,
    width: 2.6,
    depth: 2.6,
    height: 3.6,
  },
  cactusTall: {
    src: "/models/kenney/nature-kit/cactus-tall.glb",
    sourceWidth: 0.39624995,
    sourceDepth: 0.339082063,
    sourceHeight: 0.75,
    sourceMinY: 0,
    width: 1.3,
    depth: 1.1,
    height: 2.4,
  },
} as const;

export type KenneyNatureAssetId = keyof typeof KENNEY_NATURE_ASSETS;

export function getKenneyNatureAsset(
  environmentId: StageEnvironmentId,
  kind: EnvironmentPropKind,
): KenneyNatureAssetId | null {
  if (kind === "tree" && ["suburban", "orchard", "river-checkpoint"].includes(environmentId)) {
    return "treeOak";
  }
  if (kind === "pine" && environmentId === "redwood") return "pineTall";
  if (kind === "palm" && ["jungle-ruins", "mangrove"].includes(environmentId)) {
    return "palmTall";
  }
  if (kind === "cactus" && environmentId === "desert-bazaar") return "cactusTall";
  return null;
}
