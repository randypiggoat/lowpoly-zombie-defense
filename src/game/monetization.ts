export type RewardedPlacement =
  | "double-run-rewards"
  | "revive"
  | "modifier-reroll"
  | "bonus-cache"
  | "daily-bonus";

export type PurchaseProduct =
  | "remove-ads"
  | "supporter-pack"
  | "cosmetic-pack";

export type InterstitialReason = "run-complete" | "stage-complete";

export type MonetizationProvider = {
  canShowRewarded(): boolean;
  showRewarded(placement: RewardedPlacement): Promise<boolean>;
  canShowInterstitial(): boolean;
  showInterstitial(reason: InterstitialReason): Promise<boolean>;
  canPurchase(product: PurchaseProduct): boolean;
  purchase(product: PurchaseProduct): Promise<boolean>;
};

export type InterstitialDecisionInput = {
  now: number;
  lastShownAt: number | null;
  inCombat: boolean;
  adsRemoved: boolean;
};

export const MIN_INTERSTITIAL_GAP_MS = 3 * 60 * 1000;

export function canShowInterstitial({
  now,
  lastShownAt,
  inCombat,
  adsRemoved,
}: InterstitialDecisionInput) {
  if (inCombat || adsRemoved) return false;
  if (lastShownAt === null) return true;
  return now - lastShownAt >= MIN_INTERSTITIAL_GAP_MS;
}

export function rewardedPlacementLabel(placement: RewardedPlacement) {
  switch (placement) {
    case "double-run-rewards":
      return "Double run rewards";
    case "revive":
      return "Revive";
    case "modifier-reroll":
      return "Reroll power";
    case "bonus-cache":
      return "Bonus cache";
    case "daily-bonus":
      return "Daily bonus";
  }
}

export function purchaseLabel(product: PurchaseProduct) {
  switch (product) {
    case "remove-ads":
      return "Remove Ads";
    case "supporter-pack":
      return "Supporter Pack";
    case "cosmetic-pack":
      return "Cosmetic Pack";
  }
}

export type ExternalMonetizationProvider = Partial<MonetizationProvider>;

let externalProvider: ExternalMonetizationProvider | null = null;
let lastInterstitialAt: number | null = null;

export function setMonetizationProvider(provider: ExternalMonetizationProvider | null) {
  externalProvider = provider;
}

export function isRewardedAvailable() {
  return externalProvider?.canShowRewarded?.() ?? false;
}

export async function showRewarded(placement: RewardedPlacement) {
  if (!(externalProvider?.canShowRewarded?.() ?? false)) return false;
  return externalProvider.showRewarded?.(placement) ?? false;
}

export function isInterstitialAvailable(
  input: Omit<InterstitialDecisionInput, "lastShownAt"> & { now: number },
) {
  if (!(externalProvider?.canShowInterstitial?.() ?? false)) return false;
  return canShowInterstitial({ ...input, lastShownAt: lastInterstitialAt });
}

export async function showInterstitial(
  reason: InterstitialReason,
  input: Omit<InterstitialDecisionInput, "lastShownAt"> & { now: number },
) {
  if (!isInterstitialAvailable(input)) return false;
  const shown = await externalProvider!.showInterstitial!(reason);
  if (shown) lastInterstitialAt = input.now;
  return shown;
}

export function resetInterstitialTimer() {
  lastInterstitialAt = null;
}

export function isPurchaseAvailable(product: PurchaseProduct) {
  return externalProvider?.canPurchase?.(product) ?? false;
}

export async function purchase(product: PurchaseProduct) {
  if (!isPurchaseAvailable(product)) return false;
  return externalProvider!.purchase!(product) ?? false;
}
