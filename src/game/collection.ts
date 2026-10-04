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
    id: "ember-flame",
    name: "Cinder",
    description: "A hot forged Flamethrower finish.",
    kind: "tower",
    towerKind: "flamethrower",
    accent: "#f28b52",
    body: "#4f332c",
    requirement: "Reach Flamethrower Mastery 2.",
    unlock: (profile) => ((profile.towerMasteryXp?.flamethrower ?? 0) >= 200),
  },
  {
    id: "ember-rocket",
    name: "Hellfire",
    description: "Hot-rod Rocket finish.",
    kind: "tower",
    towerKind: "rocket",
    accent: "#ff7a3d",
    body: "#653027",
    requirement: "Reach Rocket Mastery 4.",
    unlock: (profile) => ((profile.towerMasteryXp?.rocket ?? 0) >= 400),
  },
  {
    id: "neon-laser",
    name: "Aftershock",
    description: "Neon Laser finish.",
    kind: "tower",
    towerKind: "laser",
    accent: "#5effff",
    body: "#264f57",
    requirement: "Reach Laser Mastery 5.",
    unlock: (profile) => ((profile.towerMasteryXp?.laser ?? 0) >= 500),
  },
  {
    id: "seasonal-vanguard",
    name: "Vanguard",
    description: "A frost-and-crimson finish for Freezer.",
    kind: "tower",
    towerKind: "freezer",
    accent: "#a9d9e8",
    body: "#563b49",
    requirement: "Claim a seasonal event finale.",
    unlock: (profile) => profile.seasonalEventUnlocks?.includes("seasonal-vanguard") ?? false,
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


export type ZombieCosmetic = {
  id: string;
  name: string;
  description: string;
  skin: string;
  cloth: string;
  legs: string;
  requirement: string;
  unlock: (profile: PlayerProfile) => boolean;
};

export const ZOMBIE_COSMETICS: ZombieCosmetic[] = [
  {
    id: "zombie-default",
    name: "Outbreak",
    description: "The classic Rotwood infected palette.",
    skin: "#6f9f55",
    cloth: "#42513f",
    legs: "#35404a",
    requirement: "Available from the start.",
    unlock: () => true,
  },
  {
    id: "zombie-nightfall",
    name: "Nightfall",
    description: "A darker infected palette earned through sustained defense.",
    skin: "#536f63",
    cloth: "#28333a",
    legs: "#202932",
    requirement: "Reach 500 zombie kills.",
    unlock: (profile) => profile.totalKills >= 500,
  },
  {
    id: "zombie-burnout",
    name: "Burnout",
    description: "A scorched palette earned by surviving major threats.",
    skin: "#9a5a48",
    cloth: "#4b2927",
    legs: "#302226",
    requirement: "Defeat 25 Brutes.",
    unlock: (profile) => profile.bruteKills >= 25,
  },
  {
    id: "zombie-void",
    name: "Void",
    description: "An endgame palette for dedicated endless players.",
    skin: "#5b5a7a",
    cloth: "#292840",
    legs: "#1f2032",
    requirement: "Reach Endless Wave 50.",
    unlock: (profile) => profile.endlessBestWave >= 50,
  },
];
