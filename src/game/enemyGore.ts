import type { StageEnemyKind } from "./navigation";

export type GorePart =
  | "head"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg"
  | "left-shoulder"
  | "right-shoulder"
  | "runner-crest"
  | "splitter-core"
  | "bomber-pack"
  | "guardian-shield"
  | "healer-aura"
  | "swarm-crest";

export type GoreAnchor = {
  x: number;
  y: number;
  z: number;
  size: number;
};


export const GORE_SIGNATURE_PARTS: readonly GorePart[] = [
  "runner-crest",
  "splitter-core",
  "bomber-pack",
  "guardian-shield",
  "healer-aura",
  "swarm-crest",
];

export function gorePartKind(part: GorePart): StageEnemyKind | null {
  switch (part) {
    case "runner-crest": return 1;
    case "splitter-core": return 3;
    case "bomber-pack": return 4;
    case "guardian-shield": return 5;
    case "healer-aura": return 6;
    case "swarm-crest": return 7;
    default: return null;
  }
}

const PARTS_BY_KIND: Record<number, readonly GorePart[]> = {
  0: ["left-arm", "right-arm", "left-leg", "head"],
  1: ["left-leg", "right-leg", "runner-crest", "head"],
  2: ["left-shoulder", "right-shoulder", "left-arm", "head"],
  3: ["splitter-core", "left-arm", "right-arm", "head"],
  4: ["bomber-pack", "left-arm", "right-arm", "head"],
  5: ["guardian-shield", "left-arm", "right-arm", "head"],
  6: ["healer-aura", "left-arm", "right-arm", "head"],
  7: ["swarm-crest", "left-arm", "right-arm", "head"],
};

const ANCHORS: Record<GorePart, GoreAnchor> = {
  "head": { x: 0, y: 1.62, z: 0.1, size: 0.13 },
  "left-arm": { x: 0.42, y: 1.15, z: 0.34, size: 0.09 },
  "right-arm": { x: -0.42, y: 1.15, z: 0.34, size: 0.09 },
  "left-leg": { x: 0.18, y: 0.26, z: 0, size: 0.09 },
  "right-leg": { x: -0.18, y: 0.26, z: 0, size: 0.09 },
  "left-shoulder": { x: 0.55, y: 1.5, z: 0.02, size: 0.12 },
  "right-shoulder": { x: -0.55, y: 1.5, z: 0.02, size: 0.12 },
  "runner-crest": { x: 0, y: 1.92, z: -0.04, size: 0.09 },
  "splitter-core": { x: 0, y: 1.05, z: 0.42, size: 0.11 },
  "bomber-pack": { x: 0, y: 0.92, z: -0.4, size: 0.12 },
  "guardian-shield": { x: 0, y: 1.08, z: 0.02, size: 0.11 },
  "healer-aura": { x: 0, y: 0.2, z: 0, size: 0.1 },
  "swarm-crest": { x: 0, y: 1.94, z: 0, size: 0.09 },
};

export function gorePartsForKind(kind: number) {
  return PARTS_BY_KIND[kind] ?? PARTS_BY_KIND[0]!;
}

export function gorePartBit(part: GorePart) {
  const all = [
    "head",
    "left-arm",
    "right-arm",
    "left-leg",
    "right-leg",
    "left-shoulder",
    "right-shoulder",
    "runner-crest",
    "splitter-core",
    "bomber-pack",
    "guardian-shield",
    "healer-aura",
    "swarm-crest",
  ] as const;
  return 1 << all.indexOf(part);
}

export function goreAnchor(part: GorePart) {
  return ANCHORS[part];
}

export function gorePartsBrokenBetween(
  kind: number,
  previousRatio: number,
  nextRatio: number,
  currentMask = 0,
) {
  const parts = gorePartsForKind(kind);
  const start = Math.max(0, Math.min(1, previousRatio));
  const end = Math.max(0, Math.min(1, nextRatio));
  if (start <= end) return [];

  const out: GorePart[] = [];
  parts.forEach((part, index) => {
    if (currentMask & gorePartBit(part)) return;
    const threshold = 0.8 - index * 0.2;
    if (start > threshold && end <= threshold) out.push(part);
  });
  return out;
}
