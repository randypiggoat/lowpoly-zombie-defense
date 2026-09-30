import { describe, expect, test } from "bun:test";
import {
  gorePartBit,
  gorePartsBrokenBetween,
  gorePartsForKind,
  GORE_SIGNATURE_PARTS,
} from "./enemyGore";

describe("enemy gore breakpoints", () => {
  test("large damage crosses several readable body breakpoints", () => {
    const parts = gorePartsBrokenBetween(0, 1, 0.1);
    expect(parts).toHaveLength(4);
    expect(new Set(parts).size).toBe(4);
  });

  test("breakpoints are emitted once", () => {
    const first = gorePartsBrokenBetween(1, 1, 0.55);
    const mask = first.reduce((value, part) => value | gorePartBit(part), 0);
    const second = gorePartsBrokenBetween(1, 0.55, 0.35, mask);
    expect(second.some((part) => mask & gorePartBit(part))).toBe(false);
  });

  test("enemy silhouettes have a deliberate four-part damage language", () => {
    for (const kind of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(gorePartsForKind(kind)).toHaveLength(4);
    }
  });
});

  test("special enemy breakpoints stay tied to their own signature parts", () => {
    expect(GORE_SIGNATURE_PARTS).toContain("runner-crest");
    expect(gorePartsForKind(1)).toContain("runner-crest");
    expect(gorePartsForKind(3)).toContain("splitter-core");
    expect(gorePartsForKind(4)).toContain("bomber-pack");
    expect(gorePartsForKind(5)).toContain("guardian-shield");
    expect(gorePartsForKind(6)).toContain("healer-aura");
    expect(gorePartsForKind(7)).toContain("swarm-crest");
    expect(gorePartsForKind(0)).not.toContain("splitter-core");
    expect(gorePartsForKind(0)).not.toContain("bomber-pack");
  });
