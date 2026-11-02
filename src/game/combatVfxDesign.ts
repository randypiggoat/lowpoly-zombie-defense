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
  sparkCount: 2 | 3 | 4;
  sparkScale: readonly [number, number, number];
}>;

/**
 * Impact hues reuse the exact canonical tower accent tokens from the art bible.
 * Small, pooled accents make each tower's hit readable without
 * changing combat simulation, damage, status effects, or reward calculations.
 * These values are presentation-only and intentionally avoid large screen-filling
 * effects on mobile.
 */
export const TOWER_IMPACT_PROFILES: Readonly<Record<TowerKind, CombatImpactProfile>> = {
  rifleman: {
    color: "#e9b44c",
    scale: 0.78,
    spread: 0.34,
    verticalSpread: 0.1,
    lift: 0.035,
    ringScaleX: 0.9,
    ringScaleY: 0.72,
    ringTilt: Math.PI / 2,
    rotationSpeed: 3.1,
    sparkCount: 3,
    sparkScale: [0.42, 1.55, 0.42],
  },
  shotgunner: {
    color: "#d98a3c",
    scale: 1.12,
    spread: 0.58,
    verticalSpread: 0.16,
    lift: 0.045,
    ringScaleX: 1.38,
    ringScaleY: 1.12,
    ringTilt: Math.PI / 2,
    rotationSpeed: 4.8,
    sparkCount: 4,
    sparkScale: [1.35, 0.86, 0.62],
  },
  sniper: {
    color: "#8fb98a",
    scale: 0.84,
    spread: 0.24,
    verticalSpread: 0.06,
    lift: 0.02,
    ringScaleX: 1.85,
    ringScaleY: 0.36,
    ringTilt: Math.PI / 2,
    rotationSpeed: 1.2,
    sparkCount: 2,
    sparkScale: [0.22, 2.65, 0.22],
  },
  tesla: {
    color: "#b892ff",
    scale: 1.02,
    spread: 0.5,
    verticalSpread: 0.58,
    lift: 0.18,
    ringScaleX: 0.82,
    ringScaleY: 1.26,
    ringTilt: 0.18,
    rotationSpeed: 6.2,
    sparkCount: 4,
    sparkScale: [0.32, 2.05, 0.32],
  },
  flamethrower: {
    color: "#f2703b",
    scale: 0.98,
    spread: 0.42,
    verticalSpread: 0.44,
    lift: 0.2,
    ringScaleX: 1.12,
    ringScaleY: 0.82,
    ringTilt: Math.PI / 2,
    rotationSpeed: 2.6,
    sparkCount: 4,
    sparkScale: [0.78, 1.35, 0.52],
  },
  freezer: {
    color: "#79c7e3",
    scale: 0.92,
    spread: 0.4,
    verticalSpread: 0.22,
    lift: 0.1,
    ringScaleX: 0.78,
    ringScaleY: 1.24,
    ringTilt: Math.PI / 2,
    rotationSpeed: -2.2,
    sparkCount: 4,
    sparkScale: [0.62, 1.95, 0.62],
  },
  rocket: {
    color: "#e2725b",
    scale: 1.42,
    spread: 0.78,
    verticalSpread: 0.34,
    lift: 0.13,
    ringScaleX: 1.48,
    ringScaleY: 1.34,
    ringTilt: Math.PI / 2,
    rotationSpeed: 5.2,
    sparkCount: 4,
    sparkScale: [1.72, 1.05, 0.86],
  },
  laser: {
    color: "#63e6c3",
    scale: 0.76,
    spread: 0.2,
    verticalSpread: 0.035,
    lift: 0.015,
    ringScaleX: 2.05,
    ringScaleY: 0.24,
    ringTilt: Math.PI / 2,
    rotationSpeed: 0.35,
    sparkCount: 2,
    sparkScale: [0.14, 3.1, 0.14],
  },
};

export function getCombatImpactProfile(
  kind: TowerKind | null | undefined,
): CombatImpactProfile | null {
  return kind ? TOWER_IMPACT_PROFILES[kind] : null;
}
