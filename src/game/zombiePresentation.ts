import type { StageEnemyKind } from "./navigation";

export type ZombiePresentation = {
  name: string;
  silhouette: string;
  gait: number;
  stride: number;
  armSwing: number;
  bodySway: number;
  headBob: number;
  headTurn: number;
  idleRate: number;
  idleAmp: number;
  forwardLean: number;
  damageLean: number;
  hitRecoil: number;
  hitTwist: number;
  deathFold: number;
  bodyY: number;
  bodyZ: number;
  bodyScale: readonly [number, number, number];
  headY: number;
  headZ: number;
  headScale: readonly [number, number, number];
  armSpread: number;
  armY: number;
  armZ: number;
  armScale: readonly [number, number, number];
  legSpread: number;
  legScale: readonly [number, number, number];
  faceScale: number;
  faceY: number;
  faceZ: number;
};

export const ZOMBIE_PRESENTATION: Record<StageEnemyKind, ZombiePresentation> = {
  0: {
    bodyY: 0.95, bodyZ: 0, bodyScale: [1, 1, 1],
    headY: 1.62, headZ: 0, headScale: [1, 1, 1],
    armSpread: 0.42, armY: 1.15, armZ: 0.3, armScale: [1, 1, 1],
    legSpread: 0.17, legScale: [1, 1, 1],
    name: "Walker",
    silhouette: "balanced baseline",
    gait: 4.2,
    stride: 0.22,
    armSwing: 0.2,
    bodySway: 0.045,
    headBob: 0.045,
    headTurn: 0.05,
    idleRate: 1.4,
    idleAmp: 0.035,
    forwardLean: 0,
    damageLean: 0.12,
    hitRecoil: 0.32,
    hitTwist: 0.22,
    deathFold: 0.85,
    faceScale: 0.9,
    faceY: 1.62,
    faceZ: 0.235,
  },
  1: {
    bodyY: 0.9, bodyZ: 0.08, bodyScale: [0.68, 1.06, 0.72],
    headY: 1.55, headZ: 0.12, headScale: [0.78, 0.86, 0.82],
    armSpread: 0.3, armY: 1.1, armZ: 0.42, armScale: [0.65, 1.12, 0.65],
    legSpread: 0.17, legScale: [0.68, 1.15, 0.68],
    name: "Runner",
    silhouette: "forward-leaning sprinter",
    gait: 7.8,
    stride: 0.5,
    armSwing: 0.42,
    bodySway: 0.08,
    headBob: 0.085,
    headTurn: 0.11,
    idleRate: 2.8,
    idleAmp: 0.055,
    forwardLean: 0.18,
    damageLean: 0.16,
    hitRecoil: 0.42,
    hitTwist: 0.3,
    deathFold: 1.1,
    faceScale: 0.84,
    faceY: 1.56,
    faceZ: 0.36,
  },
  2: {
    bodyY: 1.05, bodyZ: 0, bodyScale: [1.42, 1.28, 1.25],
    headY: 1.83, headZ: 0.02, headScale: [1.22, 1.1, 1.15],
    armSpread: 0.58, armY: 1.2, armZ: 0.28, armScale: [1.35, 1.32, 1.35],
    legSpread: 0.17, legScale: [1.3, 1.12, 1.3],
    name: "Brute",
    silhouette: "heavy shoulders and planted stride",
    gait: 2.8,
    stride: 0.16,
    armSwing: 0.12,
    bodySway: 0.04,
    headBob: 0.035,
    headTurn: 0.045,
    idleRate: 0.85,
    idleAmp: 0.04,
    forwardLean: -0.025,
    damageLean: 0.08,
    hitRecoil: 0.5,
    hitTwist: 0.28,
    deathFold: 0.72,
    faceScale: 1.15,
    faceY: 1.8,
    faceZ: 0.42,
  },
  3: {
    bodyY: 0.98, bodyZ: 0, bodyScale: [1.05, 1.18, 0.9],
    headY: 1.62, headZ: 0.02, headScale: [0.92, 1.08, 0.9],
    armSpread: 0.44, armY: 1.15, armZ: 0.34, armScale: [0.9, 1.08, 0.88],
    legSpread: 0.16, legScale: [0.92, 1.04, 0.92],
    name: "Splitter",
    silhouette: "asymmetric unstable core",
    gait: 4.7,
    stride: 0.27,
    armSwing: 0.24,
    bodySway: 0.1,
    headBob: 0.06,
    headTurn: 0.09,
    idleRate: 1.7,
    idleAmp: 0.06,
    forwardLean: 0.035,
    damageLean: 0.2,
    hitRecoil: 0.38,
    hitTwist: 0.4,
    deathFold: 1.2,
    faceScale: 0.98,
    faceY: 1.62,
    faceZ: 0.36,
  },
  4: {
    bodyY: 0.98, bodyZ: -0.04, bodyScale: [1.1, 1, 1.05],
    headY: 1.64, headZ: 0.03, headScale: [1.08, 0.92, 1.02],
    armSpread: 0.43, armY: 1.15, armZ: 0.28, armScale: [1.04, 1.04, 1.04],
    legSpread: 0.17, legScale: [1.02, 1.04, 1.02],
    name: "Bomber",
    silhouette: "unstable pack-heavy body",
    gait: 3.7,
    stride: 0.2,
    armSwing: 0.28,
    bodySway: 0.12,
    headBob: 0.07,
    headTurn: 0.08,
    idleRate: 2.4,
    idleAmp: 0.075,
    forwardLean: 0.06,
    damageLean: 0.22,
    hitRecoil: 0.42,
    hitTwist: 0.34,
    deathFold: 1.05,
    faceScale: 1.02,
    faceY: 1.57,
    faceZ: 0.255,
  },
  5: {
    bodyY: 1.02, bodyZ: 0, bodyScale: [1.18, 1.16, 1.12],
    headY: 1.72, headZ: 0.03, headScale: [1.08, 1.02, 1.06],
    armSpread: 0.5, armY: 1.18, armZ: 0.34, armScale: [1.12, 1.1, 1.12],
    legSpread: 0.18, legScale: [1.1, 1.08, 1.1],
    name: "Guardian",
    silhouette: "wide defensive stance",
    gait: 2.4,
    stride: 0.1,
    armSwing: 0.08,
    bodySway: 0.025,
    headBob: 0.025,
    headTurn: 0.04,
    idleRate: 0.65,
    idleAmp: 0.03,
    forwardLean: -0.04,
    damageLean: 0.06,
    hitRecoil: 0.24,
    hitTwist: 0.17,
    deathFold: 0.65,
    faceScale: 1.08,
    faceY: 1.67,
    faceZ: 0.36,
  },
  6: {
    bodyY: 0.95, bodyZ: 0, bodyScale: [0.9, 1.05, 0.94],
    headY: 1.62, headZ: 0.02, headScale: [1, 1.03, 0.98],
    armSpread: 0.4, armY: 1.13, armZ: 0.26, armScale: [0.9, 1.08, 0.9],
    legSpread: 0.17, legScale: [0.9, 1.02, 0.9],
    name: "Healer",
    silhouette: "slender floating support",
    gait: 3.6,
    stride: 0.12,
    armSwing: 0.18,
    bodySway: 0.055,
    headBob: 0.05,
    headTurn: 0.07,
    idleRate: 1.25,
    idleAmp: 0.08,
    forwardLean: 0.02,
    damageLean: 0.15,
    hitRecoil: 0.3,
    hitTwist: 0.22,
    deathFold: 0.95,
    faceScale: 0.9,
    faceY: 1.57,
    faceZ: 0.255,
  },
  7: {
    bodyY: 0.82, bodyZ: 0, bodyScale: [0.78, 0.86, 0.8],
    headY: 1.43, headZ: 0.02, headScale: [0.94, 0.9, 0.92],
    armSpread: 0.34, armY: 1.02, armZ: 0.34, armScale: [0.76, 0.9, 0.76],
    legSpread: 0.14, legScale: [0.72, 0.9, 0.72],
    name: "Swarm",
    silhouette: "small coordinated dart",
    gait: 9.5,
    stride: 0.36,
    armSwing: 0.3,
    bodySway: 0.16,
    headBob: 0.1,
    headTurn: 0.18,
    idleRate: 3.8,
    idleAmp: 0.07,
    forwardLean: 0.16,
    damageLean: 0.2,
    hitRecoil: 0.35,
    hitTwist: 0.34,
    deathFold: 1.25,
    faceScale: 0.9,
    faceY: 1.57,
    faceZ: 0.25,
  },
};

export const DAMAGE_REACTION_MULTIPLIER: Record<
  string,
  number
> = {
  rifleman: 0.7,
  shotgunner: 1.05,
  sniper: 1.3,
  tesla: 0.8,
  flamethrower: 0.75,
  freezer: 0.68,
  rocket: 1.45,
  laser: 0.82,
};

export function zombiePresentation(kind: StageEnemyKind) {
  return ZOMBIE_PRESENTATION[kind];
}

export function damageReactionMultiplier(kind?: string) {
  return kind ? DAMAGE_REACTION_MULTIPLIER[kind] ?? 1 : 1;
}

export function hitDirection(
  targetX: number,
  targetZ: number,
  sourceX: number,
  sourceZ: number,
) {
  const x = targetX - sourceX;
  const z = targetZ - sourceZ;
  const length = Math.hypot(x, z);
  if (length <= 0.001) return { x: 0, z: 0 };
  return { x: x / length, z: z / length };
}
