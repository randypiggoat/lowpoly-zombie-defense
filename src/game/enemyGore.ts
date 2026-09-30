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


const DEATH_DEBRIS_BY_KIND: Record<number, readonly GorePart[]> = {
  0: ["head", "left-arm", "right-arm", "left-leg", "right-leg"],
  1: ["runner-crest", "left-leg", "right-leg", "head", "right-arm"],
  2: ["left-shoulder", "right-shoulder", "left-arm", "right-arm", "head"],
  3: ["splitter-core", "left-arm", "right-arm", "head", "right-leg"],
  4: ["bomber-pack", "head", "left-arm", "right-arm", "left-leg"],
  5: ["guardian-shield", "left-arm", "right-arm", "head", "left-leg"],
  6: ["healer-aura", "head", "left-arm", "right-arm", "left-leg"],
  7: ["swarm-crest", "left-arm", "right-arm", "head", "right-leg"],
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

export function deathGorePartsForKind(kind: number) {
  return DEATH_DEBRIS_BY_KIND[kind] ?? DEATH_DEBRIS_BY_KIND[0]!;
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
