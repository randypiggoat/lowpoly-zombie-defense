export type StoreProductKind = "cosmetic" | "support";

export type StoreProduct = {
  id: string;
  kind: StoreProductKind;
  name: string;
  tagline: string;
  priceLabel: string;
  accent: string;
  availability: "featured" | "rotation" | "coming-soon";
  includes: string[];
};

/**
 * Store catalog is intentionally platform-neutral.
 *
 * The web build can present products and preview UI, but real App Store / Google Play
 * purchases must be wired through native platform billing before a price can actually
 * be charged. Keeping the catalog here gives the future native shell stable product IDs.
 */
export const STORE_CATALOG: readonly StoreProduct[] = [
  {
    id: "cosmetic-scrap-cannon",
    kind: "cosmetic",
    name: "SCRAP CANNON",
    tagline: "Junkyard steel. Heavy punch.",
    priceLabel: "$2.99",
    accent: "#d6a54a",
    availability: "featured",
    includes: ["Tower skin", "Custom muzzle flash", "Custom impact trail"],
  },
  {
    id: "cosmetic-night-watch",
    kind: "cosmetic",
    name: "NIGHT WATCH",
    tagline: "Midnight gear for the front line.",
    priceLabel: "$2.99",
    accent: "#8bb7c9",
    availability: "rotation",
    includes: ["Rifleman skin", "Tracers", "Night kill effect"],
  },
  {
    id: "cosmetic-red-alert",
    kind: "cosmetic",
    name: "RED ALERT",
    tagline: "Emergency lights. Zero subtlety.",
    priceLabel: "$3.99",
    accent: "#cb644b",
    availability: "rotation",
    includes: ["Base theme", "Alarm light effect", "Warning banner"],
  },
  {
    id: "support-ad-free",
    kind: "support",
    name: "CLEAR SKIES",
    tagline: "Remove optional rewarded-ad prompts.",
    priceLabel: "$4.99",
    accent: "#e7d8ae",
    availability: "coming-soon",
    includes: ["Ad-free convenience", "Support development"],
  },
];

export function getFeaturedProducts() {
  return STORE_CATALOG.filter((product) => product.availability === "featured");
}

export function getRotationProducts() {
  return STORE_CATALOG.filter((product) => product.availability === "rotation");
}

/**
 * Native shells can replace this with StoreKit / Play Billing availability.
 * The browser build remains presentation-only until platform billing is connected.
 */
export function canPurchaseInCurrentBuild() {
  return false;
}
