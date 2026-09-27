import type { PlayerProfile } from "./profile";

export type TowerCosmetic = {
  id: string;
  name: string;
  description: string;
  kind: "all" | "tower";
  towerKind?: string;
  accent: string;
  body: string;
  requirement: string;
  unlock: (profile: PlayerProfile) => boolean;
};

export const TOWER_COSMETICS: TowerCosmetic[] = [
  {
    id: "default",
    name: "Field Issue",
    description: "Original Rotwood colors.",
    kind: "all",
    accent: "",
    body: "",
    requirement: "Available from the start.",
    unlock: () => true,
  },
  {
    id: "bloodmoon-rifle",
    name: "Blood Moon",
    description: "Crimson finish for Rifleman.",
    kind: "tower",
    towerKind: "rifleman",
    accent: "#e24b4b",
    body: "#542d36",
    requirement: "Kill 100 zombies.",
    unlock: (profile) => profile.totalKills >= 100,
  },
  {
    id: "gold-shotgun",
    name: "Prospector",
    description: "Gold-trimmed Shotgunner.",
    kind: "tower",
    towerKind: "shotgunner",
    accent: "#ffd45a",
    body: "#6d5430",
    requirement: "Complete Stage 3.",
    unlock: (profile) => Boolean(profile.stageProgress["3"]?.completed),
  },
  {
    id: "frost-sniper",
    name: "Whiteout",
    description: "Cold-steel Sniper package.",
    kind: "tower",
    towerKind: "sniper",
    accent: "#b9ecff",
    body: "#365261",
    requirement: "Reach Wave 25.",
    unlock: (profile) => profile.highestWave >= 25,
  },
  {
    id: "storm-tesla",
    name: "Stormcore",
    description: "High-voltage Tesla finish.",
    kind: "tower",
    towerKind: "tesla",
    accent: "#72f5dc",
    body: "#294c53",
    requirement: "Reach Wave 50.",
    unlock: (profile) => profile.highestWave >= 50,
  },
  {
    id: "ember-rocket",
    name: "Hellfire",
    description: "Hot-rod Rocket finish.",
    kind: "tower",
    towerKind: "rocket",
    accent: "#ff7a3d",
    body: "#653027",
    requirement: "Kill 1,000 zombies.",
    unlock: (profile) => profile.totalKills >= 1000,
  },
  {
    id: "neon-laser",
    name: "Aftershock",
    description: "Neon Laser finish.",
    kind: "tower",
    towerKind: "laser",
    accent: "#5effff",
    body: "#264f57",
    requirement: "Reach Endless Wave 50.",
    unlock: (profile) => profile.endlessBestWave >= 50,
  },
];

export function unlockedTowerCosmetics(profile: PlayerProfile) {
  return TOWER_COSMETICS.filter((cosmetic) => cosmetic.unlock(profile));
}

export function cosmeticForTower(
  kind: string,
  equippedId: string | null | undefined,
) {
  const cosmetic = TOWER_COSMETICS.find(
    (entry) => entry.id === equippedId && (entry.kind === "all" || entry.towerKind === kind),
  );
  return cosmetic?.id === "default" ? null : cosmetic ?? null;
}
