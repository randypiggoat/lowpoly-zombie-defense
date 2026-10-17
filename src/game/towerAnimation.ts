import type { TowerKind } from "./engine";

export type TowerAnimationProfile = Readonly<{
  idleAmplitude: number;
  idleSpeed: number;
  idleSway: number;
  weaponRecoil: number;
  bodyKick: number;
  bodySquash: number;
  recoilRoll: number;
  anticipationLift: number;
  anticipationPitch: number;
  signatureSpin: number;
}>;

/**
 * Small, tower-specific motion profiles for the procedural tower rigs.
 * Keep geometry/material creation out of the frame loop; these are immutable
 * scalars shared by every instance of a tower kind.
 */
export const TOWER_ANIMATION_PROFILES: Readonly<Record<TowerKind, TowerAnimationProfile>> = {
  rifleman: {
    idleAmplitude: 0.022,
    idleSpeed: 2.65,
    idleSway: 0.009,
    weaponRecoil: 0.13,
    bodyKick: 0.045,
    bodySquash: 0.04,
    recoilRoll: 0.022,
    anticipationLift: 0.018,
    anticipationPitch: -0.012,
    signatureSpin: 0.07,
  },
  shotgunner: {
    idleAmplitude: 0.015,
    idleSpeed: 1.55,
    idleSway: 0.005,
    weaponRecoil: 0.19,
    bodyKick: 0.075,
    bodySquash: 0.065,
    recoilRoll: 0.03,
    anticipationLift: 0.024,
    anticipationPitch: -0.018,
    signatureSpin: 0.07,
  },
  sniper: {
    idleAmplitude: 0.008,
    idleSpeed: 1.15,
    idleSway: 0.004,
    weaponRecoil: 0.075,
    bodyKick: 0.025,
    bodySquash: 0.02,
    recoilRoll: 0.007,
    anticipationLift: 0.01,
    anticipationPitch: -0.022,
    signatureSpin: 0.07,
  },
  tesla: {
    idleAmplitude: 0.014,
    idleSpeed: 1.8,
    idleSway: 0.006,
    weaponRecoil: 0.035,
    bodyKick: 0.028,
    bodySquash: 0.025,
    recoilRoll: 0.006,
    anticipationLift: 0.018,
    anticipationPitch: 0,
    signatureSpin: 0.52,
  },
  flamethrower: {
    idleAmplitude: 0.02,
    idleSpeed: 1.75,
    idleSway: 0.011,
    weaponRecoil: 0.105,
    bodyKick: 0.043,
    bodySquash: 0.04,
    recoilRoll: 0.016,
    anticipationLift: 0.03,
    anticipationPitch: -0.015,
    signatureSpin: 0.1,
  },
  freezer: {
    idleAmplitude: 0.016,
    idleSpeed: 1.3,
    idleSway: 0.005,
    weaponRecoil: 0.04,
    bodyKick: 0.025,
    bodySquash: 0.02,
    recoilRoll: 0.006,
    anticipationLift: 0.024,
    anticipationPitch: -0.012,
    signatureSpin: 0.18,
  },
  rocket: {
    idleAmplitude: 0.01,
    idleSpeed: 1,
    idleSway: 0.004,
    weaponRecoil: 0.24,
    bodyKick: 0.095,
    bodySquash: 0.08,
    recoilRoll: 0.035,
    anticipationLift: 0.035,
    anticipationPitch: -0.025,
    signatureSpin: -0.12,
  },
  laser: {
    idleAmplitude: 0.012,
    idleSpeed: 1.6,
    idleSway: 0.005,
    weaponRecoil: 0.035,
    bodyKick: 0.027,
    bodySquash: 0.02,
    recoilRoll: 0.005,
    anticipationLift: 0.027,
    anticipationPitch: -0.005,
    signatureSpin: -0.24,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * The simulation sets recoil to 1 on the shot frame, then decays it to 0.
 * Keep the muzzle at its authored transform at recoil=1, animate a short
 * spring-like recoil afterward, and return to rest before the next idle loop.
 */
export function getTowerShotKick(recoil: number): number {
  const normalized = clamp(Number.isFinite(recoil) ? recoil : 0, 0, 1);
  const progress = clamp((1 - normalized) / 0.58, 0, 1);
  return Math.sin(progress * Math.PI);
}

/** Brief pre-fire anticipation as a targeted tower's cooldown approaches zero. */
export function getTowerAnticipation(cooldown: number, hasTarget: boolean): number {
  if (!hasTarget) return 0;
  const remaining = Number.isFinite(cooldown) ? Math.max(0, cooldown) : 0;
  return clamp(1 - remaining / 0.14, 0, 1);
}
