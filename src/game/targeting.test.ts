import { describe, expect, test } from "bun:test";
import { selectTowerTarget } from "./targeting";
import { STAGE_MAPS } from "./maps";
import { type Zombie } from "./engine";

function zombie(overrides: Partial<Zombie> = {}): Zombie {
  return {
    id: 1,
    dist: 5,
    hp: 100,
    maxHp: 100,
    speed: 1,
    kind: 0,
    x: 0,
    y: 0,
    z: 0,
    wobble: 0,
    dead: false,
    fade: 0,
    flash: 0,
    slow: 0,
    burn: 0,
    burnTime: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    tilt: 0,
    spin: 0,
    roll: 0,
    gibbed: false,
    ...overrides,
  };
}

describe("tower targeting rules", () => {
  const tower = { x: 0, z: 0 };

  test("returns null when no living zombie is in range", () => {
    const zombies = [
      zombie({ id: 1, x: 10 }),
      zombie({ id: 2, dead: true, x: 1 }),
    ];

    expect(selectTowerTarget(zombies, tower, 5, "first")).toBeNull();
  });

  test("ignores dead zombies even when they are the best-scoring candidate", () => {
    const zombies = [
      zombie({ id: 1, dead: true, dist: 99 }),
      zombie({ id: 2, dist: 4 }),
    ];

    expect(selectTowerTarget(zombies, tower, 5, "first")?.id).toBe(2);
  });

  test("first targets the zombie furthest along the path", () => {
    const zombies = [
      zombie({ id: 1, dist: 3 }),
      zombie({ id: 2, dist: 8 }),
      zombie({ id: 3, dist: 5 }),
    ];

    expect(selectTowerTarget(zombies, tower, 10, "first")?.id).toBe(2);
  });

  test("last targets the zombie closest to the start of the path", () => {
    const zombies = [
      zombie({ id: 1, dist: 3 }),
      zombie({ id: 2, dist: 8 }),
      zombie({ id: 3, dist: 5 }),
    ];

    expect(selectTowerTarget(zombies, tower, 10, "last")?.id).toBe(1);
  });

  test("strongest targets the living zombie with the most HP", () => {
    const zombies = [
      zombie({ id: 1, hp: 25 }),
      zombie({ id: 2, hp: 125 }),
      zombie({ id: 3, hp: 75 }),
    ];

    expect(selectTowerTarget(zombies, tower, 10, "strongest")?.id).toBe(2);
  });

  test("respects tower range for target candidates", () => {
    const zombies = [
      zombie({ id: 1, x: 2, z: 1, dist: 20 }),
      zombie({ id: 2, x: 4, z: 4, dist: 50 }),
    ];

    expect(selectTowerTarget(zombies, tower, 3, "first")?.id).toBe(1);
  });

  test("keeps the first candidate when scores are tied", () => {
    const zombies = [
      zombie({ id: 11, dist: 7 }),
      zombie({ id: 22, dist: 7 }),
    ];

    expect(selectTowerTarget(zombies, tower, 10, "first")?.id).toBe(11);
  });

  test("respects line-of-sight blockers when a map is supplied", () => {
    const zombies = [
      zombie({ id: 1, x: 3.8, z: -19, dist: 8 }),
      zombie({ id: 2, x: 8, z: -13, dist: 7 }),
    ];

    expect(selectTowerTarget(zombies, { x: 3.8, z: -15 }, 10, "first", STAGE_MAPS.neighborhood)?.id).toBe(2);
  });

});
