import type { PurchaseProduct } from "./monetization";

export type StoreCatalogEntry = {
  product: PurchaseProduct;
  title: string;
  description: string;
  kind: "quality-of-life" | "support" | "cosmetic";
};

export const STORE_CATALOG: readonly StoreCatalogEntry[] = [
  {
    product: "remove-ads",
    title: "Remove Ads",
    description: "Permanently removes interstitial ads. Rewarded ads remain optional.",
    kind: "quality-of-life",
  },
  {
    product: "supporter-pack",
    title: "Supporter Pack",
    description: "An optional purchase for players who want to support development.",
    kind: "support",
  },
  {
    product: "cosmetic-pack",
    title: "Cosmetic Pack",
    description: "An optional purchase for extra visual customization.",
    kind: "cosmetic",
  },
];

export function storeItemStatus(
  available: boolean,
  owned: boolean,
) {
  if (owned) return "OWNED";
  if (available) return "AVAILABLE";
  return "MOBILE STORE";
}
