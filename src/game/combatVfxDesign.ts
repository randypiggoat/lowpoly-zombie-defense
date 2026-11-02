import type { TowerKind } from "./engine";

export type CombatImpactProfile = Readonly<{
  color: string;
  scale: number;
  spread: number;
  verticalSpread: number;
  lift: number;
  ringScaleX: number;
  ringScaleY: number;
  ringTilt: number;
  rotationSpeed: number;
}>;

/**
 * Small, pooled impact accents that make each tower's hit readable without
 * changing combat simulation, damage, status effects, or reward calculations.
 * These values are presentation-only and intentionally avoid large screen-filling
 * effects on mobile.
 */
export const TOWER_IMPACT_PROFILES: Readonly<Record<TowerKind, CombatImpactProfile>> = {
  rifleman: {
    color: "#ffe7b3",
    scale: 0.78,
    spread: 0.34,
    verticalSpread: 0.1,
    lift: 0.035,
    ringScaleX: 0.9,
    ringScaleY: 0.72,
    ringTilt: Math.PI / 2,
    rotationSpeed: 3.1,
  },
  shotgunner: {
    color: "#ffd08a",
    scale: 1.12,
    spread: 0.58,
    verticalSpread: 0.16,
    lift: 0.045,
    ringScaleX: 1.38,
    ringScaleY: 1.12,
    ringTilt: Math.PI / 2,
    rotationSpeed: 4.8,
  },
  sniper: {
    color: "#f5f4df",
    scale: 0.84,
    spread: 0.24,
    verticalSpread: 0.06,
    lift: 0.02,
    ringScaleX: 1.85,
    ringScaleY: 0.36,
    ringTilt: Math.PI / 2,
    rotationSpeed: 1.2,
  },
  tesla: {
    color: "#7de9f4",
    scale: 1.02,
    spread: 0.5,
    verticalSpread: 0.58,
    lift: 0.18,
    ringScaleX: 0.82,
    ringScaleY: 1.26,
    ringTilt: 0.18,
    rotationSpeed: 6.2,
  },
  flamethrower: {
    color: "#ff9c45",
    scale: 0.98,
    spread: 0.42,
    verticalSpread: 0.44,
    lift: 0.2,
    ringScaleX: 1.12,
    ringScaleY: 0.82,
    ringTilt: Math.PI / 2,
    rotationSpeed: 2.6,
  },
  freezer: {
    color: "#b9ecff",
    scale: 0.92,
    spread: 0.4,
    verticalSpread: 0.22,
    lift: 0.1,
    ringScaleX: 0.78,
    ringScaleY: 1.24,
    ringTilt: Math.PI / 2,
    rotationSpeed: -2.2,
  },
  rocket: {
    color: "#ffb45c",
    scale: 1.42,
    spread: 0.78,
    verticalSpread: 0.34,
    lift: 0.13,
    ringScaleX: 1.48,
    ringScaleY: 1.34,
    ringTilt: Math.PI / 2,
    rotationSpeed: 5.2,
  },
  laser: {
    color: "#ffc7f4",
    scale: 0.76,
    spread: 0.2,
    verticalSpread: 0.035,
    lift: 0.015,
    ringScaleX: 2.05,
    ringScaleY: 0.24,
    ringTilt: Math.PI / 2,
    rotationSpeed: 0.35,
  },
};

export function getCombatImpactProfile(
  kind: TowerKind | null | undefined,
): CombatImpactProfile | null {
  return kind ? TOWER_IMPACT_PROFILES[kind] : null;
}
