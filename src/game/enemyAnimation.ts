import type { StageEnemyKind } from "./navigation";

export type EnemyAnimationProfile = {
  posturePitch: number;
  sway: number;
  bob: number;
  torsoTwist: number;
  armSwing: number;
  legSwing: number;
  headBob: number;
  headYaw: number;
  signaturePulse: number;
  hitPitch: number;
  hitRoll: number;
  hitYaw: number;
  deathRoll: number;
  phaseOffset: number;
};

const PROFILES: Record<StageEnemyKind, EnemyAnimationProfile> = {
  0: {
    posturePitch: 0.02, sway: 0.08, bob: 0.08, torsoTwist: 0.08,
    armSwing: 0.42, legSwing: 0.5, headBob: 0.035, headYaw: 0.035,
    signaturePulse: 0.05, hitPitch: 0.16, hitRoll: 0.2, hitYaw: 0.1,
    deathRoll: 1, phaseOffset: 0,
  },
  1: {
    posturePitch: -0.16, sway: 0.14, bob: 0.13, torsoTwist: 0.18,
    armSwing: 0.82, legSwing: 1.05, headBob: 0.075, headYaw: 0.065,
    signaturePulse: 0.1, hitPitch: 0.26, hitRoll: 0.32, hitYaw: 0.18,
    deathRoll: 1.4, phaseOffset: 1.7,
  },
  2: {
    posturePitch: 0.035, sway: 0.045, bob: 0.055, torsoTwist: 0.045,
    armSwing: 0.24, legSwing: 0.28, headBob: 0.025, headYaw: 0.02,
    signaturePulse: 0.08, hitPitch: 0.24, hitRoll: 0.18, hitYaw: 0.12,
    deathRoll: 0.8, phaseOffset: 3.1,
  },
  3: {
    posturePitch: -0.08, sway: 0.11, bob: 0.11, torsoTwist: 0.22,
    armSwing: 0.62, legSwing: 0.62, headBob: 0.055, headYaw: 0.09,
    signaturePulse: 0.16, hitPitch: 0.2, hitRoll: 0.3, hitYaw: 0.18,
    deathRoll: 1.3, phaseOffset: 4.4,
  },
  4: {
    posturePitch: 0.025, sway: 0.095, bob: 0.1, torsoTwist: 0.16,
    armSwing: 0.46, legSwing: 0.46, headBob: 0.07, headYaw: 0.045,
    signaturePulse: 0.22, hitPitch: 0.19, hitRoll: 0.24, hitYaw: 0.14,
    deathRoll: 1.7, phaseOffset: 5.8,
  },
  5: {
    posturePitch: -0.035, sway: 0.05, bob: 0.06, torsoTwist: 0.06,
    armSwing: 0.2, legSwing: 0.28, headBob: 0.03, headYaw: 0.02,
    signaturePulse: 0.08, hitPitch: 0.16, hitRoll: 0.14, hitYaw: 0.08,
    deathRoll: 0.65, phaseOffset: 7.1,
  },
  6: {
    posturePitch: 0.02, sway: 0.075, bob: 0.075, torsoTwist: 0.12,
    armSwing: 0.34, legSwing: 0.38, headBob: 0.05, headYaw: 0.05,
    signaturePulse: 0.13, hitPitch: 0.2, hitRoll: 0.22, hitYaw: 0.12,
    deathRoll: 1.1, phaseOffset: 8.6,
  },
  7: {
    posturePitch: -0.09, sway: 0.16, bob: 0.16, torsoTwist: 0.28,
    armSwing: 0.55, legSwing: 0.7, headBob: 0.09, headYaw: 0.12,
    signaturePulse: 0.24, hitPitch: 0.3, hitRoll: 0.38, hitYaw: 0.22,
    deathRoll: 1.9, phaseOffset: 10.2,
  },
};

export type EnemyFaceProfile = {
  eyeScale: [number, number, number];
  eyeGap: number;
  eyeY: number;
  eyeZ: number;
  eyeTilt: number;
  eyeColor: string;
  eyeEmissive: string;
  mouthScale: [number, number, number];
  mouthY: number;
  mouthZ: number;
  mouthTilt: number;
  mouthMode: "slit" | "open" | "jagged";
  mouthColor: string;
  browScale: [number, number, number];
  browY: number;
  browZ: number;
  browTilt: number;
  browColor: string;
  markVisible: boolean;
  markColor: string;
  markScale: number;
};

const FACES: Record<StageEnemyKind, EnemyFaceProfile> = {
  0: {
    eyeScale: [0.72, 0.58, 0.5], eyeGap: 0.17, eyeY: 1.64, eyeZ: 0.235, eyeTilt: 0,
    eyeColor: "#d9eee0", eyeEmissive: "#6d9675",
    mouthScale: [0.95, 0.22, 0.42], mouthY: 1.48, mouthZ: 0.246, mouthTilt: -0.06,
    mouthMode: "slit", mouthColor: "#2a1718",
    browScale: [1.0, 0.8, 0.8], browY: 1.73, browZ: 0.238, browTilt: 0.04,
    browColor: "#4b2d2e",
    markVisible: false, markColor: "#ffffff", markScale: 1,
  },
  1: {
    eyeScale: [0.95, 0.8, 0.55], eyeGap: 0.18, eyeY: 1.58, eyeZ: 0.27, eyeTilt: 0,
    eyeColor: "#f7e2bd", eyeEmissive: "#d8883e",
    mouthScale: [1.35, 0.28, 0.45], mouthY: 1.42, mouthZ: 0.275, mouthTilt: -0.12,
    mouthMode: "open", mouthColor: "#37181a",
    browScale: [1.15, 0.7, 0.75], browY: 1.7, browZ: 0.27, browTilt: -0.08,
    browColor: "#7a3c2f",
    markVisible: false, markColor: "#ffffff", markScale: 1,
  },
  2: {
    eyeScale: [0.52, 0.44, 0.5], eyeGap: 0.19, eyeY: 1.86, eyeZ: 0.255, eyeTilt: 0,
    eyeColor: "#cfe4c9", eyeEmissive: "#7ea96f",
    mouthScale: [0.9, 0.16, 0.4], mouthY: 1.68, mouthZ: 0.266, mouthTilt: 0.04,
    mouthMode: "slit", mouthColor: "#241315",
    browScale: [1.25, 0.65, 0.72], browY: 1.95, browZ: 0.26, browTilt: -0.14,
    browColor: "#412225",
    markVisible: false, markColor: "#ffffff", markScale: 1,
  },
  3: {
    eyeScale: [0.78, 0.56, 0.52], eyeGap: 0.2, eyeY: 1.64, eyeZ: 0.25, eyeTilt: 0.08,
    eyeColor: "#ebe7c6", eyeEmissive: "#c58b46",
    mouthScale: [1.1, 0.32, 0.44], mouthY: 1.46, mouthZ: 0.262, mouthTilt: 0.11,
    mouthMode: "jagged", mouthColor: "#3a1719",
    browScale: [0.9, 0.55, 0.72], browY: 1.74, browZ: 0.26, browTilt: 0.2,
    browColor: "#57643d",
    markVisible: true, markColor: "#e1a04f", markScale: 0.8,
  },
  4: {
    eyeScale: [1.05, 0.9, 0.56], eyeGap: 0.19, eyeY: 1.64, eyeZ: 0.285, eyeTilt: 0,
    eyeColor: "#fff0cf", eyeEmissive: "#d85d43",
    mouthScale: [0.85, 0.8, 0.72], mouthY: 1.42, mouthZ: 0.29, mouthTilt: 0,
    mouthMode: "open", mouthColor: "#42151a",
    browScale: [0.75, 0.65, 0.7], browY: 1.74, browZ: 0.28, browTilt: 0.02,
    browColor: "#724038",
    markVisible: true, markColor: "#ff7a48", markScale: 0.65,
  },
  5: {
    eyeScale: [0.58, 0.5, 0.48], eyeGap: 0.2, eyeY: 1.66, eyeZ: 0.255, eyeTilt: 0,
    eyeColor: "#bdeaf0", eyeEmissive: "#5ab9ca",
    mouthScale: [0.92, 0.16, 0.36], mouthY: 1.46, mouthZ: 0.266, mouthTilt: -0.04,
    mouthMode: "slit", mouthColor: "#203035",
    browScale: [1.15, 0.7, 0.74], browY: 1.77, browZ: 0.26, browTilt: -0.16,
    browColor: "#2f4b51",
    markVisible: true, markColor: "#70d6e3", markScale: 0.68,
  },
  6: {
    eyeScale: [1.0, 1.0, 0.52], eyeGap: 0.17, eyeY: 1.66, eyeZ: 0.27, eyeTilt: 0,
    eyeColor: "#f7d7f2", eyeEmissive: "#cb78cf",
    mouthScale: [0.65, 0.76, 0.56], mouthY: 1.43, mouthZ: 0.276, mouthTilt: 0,
    mouthMode: "open", mouthColor: "#4a1e40",
    browScale: [0.9, 0.58, 0.7], browY: 1.8, browZ: 0.27, browTilt: 0.06,
    browColor: "#6b4860",
    markVisible: true, markColor: "#d98adf", markScale: 0.55,
  },
  7: {
    eyeScale: [0.65, 0.54, 0.5], eyeGap: 0.23, eyeY: 1.66, eyeZ: 0.255, eyeTilt: 0,
    eyeColor: "#dcf7cb", eyeEmissive: "#79c455",
    mouthScale: [0.55, 0.22, 0.44], mouthY: 1.45, mouthZ: 0.266, mouthTilt: 0.18,
    mouthMode: "jagged", mouthColor: "#21351d",
    browScale: [0.7, 0.52, 0.68], browY: 1.79, browZ: 0.26, browTilt: 0.16,
    browColor: "#36522f",
    markVisible: true, markColor: "#9ce06d", markScale: 0.55,
  },
};

export function getEnemyAnimationProfile(kind: StageEnemyKind) {
  return PROFILES[kind];
}

export function getEnemyFaceProfile(kind: StageEnemyKind) {
  return FACES[kind];
}

export function getEnemySignatureName(kind: StageEnemyKind) {
  switch (kind) {
    case 1: return "runner crest";
    case 2: return "heavy shoulders";
    case 3: return "splitter core";
    case 4: return "unstable pack";
    case 5: return "guardian shield";
    case 6: return "healer aura";
    case 7: return "swarm crest";
    default: return "worn-down face";
  }
}
