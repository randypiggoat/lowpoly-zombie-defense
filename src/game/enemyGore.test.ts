import { describe, expect, test } from "bun:test";
import {
  deathGorePartsForKind,
  gorePartBit,
  gorePartsBrokenBetween,
  gorePartsForKind,
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


  test("death debris starts with the enemy signature feature", () => {
    expect(deathGorePartsForKind(1)[0]).toBe("runner-crest");
    expect(deathGorePartsForKind(3)[0]).toBe("splitter-core");
    expect(deathGorePartsForKind(4)[0]).toBe("bomber-pack");
    expect(deathGorePartsForKind(5)[0]).toBe("guardian-shield");
    expect(deathGorePartsForKind(6)[0]).toBe("healer-aura");
    expect(deathGorePartsForKind(7)[0]).toBe("swarm-crest");
  });

  test("enemy silhouettes have a deliberate four-part damage language", () => {
    for (const kind of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(gorePartsForKind(kind)).toHaveLength(4);
    }
  });
});
