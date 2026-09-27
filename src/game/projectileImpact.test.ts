import { describe, expect, test } from "bun:test";
import { getChainTargets, getSplashTargets } from "./projectileImpact";
import type { Zombie } from "./engine";

function zombie(overrides: Partial<Zombie> = {}): Zombie {
  return {
    id: 1,
    dist: 1,
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

describe("projectile impact target selection", () => {
  test("finds living splash targets inside the strict radius", () => {
    const zombies = [
      zombie({ id: 1, x: 0, z: 0 }),
      zombie({ id: 2, x: 1, z: 1 }),
      zombie({ id: 3, x: 2, z: 0 }),
      zombie({ id: 4, x: 0, z: 2, dead: true }),
    ];

    expect(
      getSplashTargets(zombies, 1, 0, 0, 1.5).map((target) => target.id),
    ).toEqual([2]);
  });

  test("excludes the primary target from splash damage", () => {
    const zombies = [
      zombie({ id: 10 }),
      zombie({ id: 20, x: 1, z: 0 }),
    ];

    expect(getSplashTargets(zombies, 10, 0, 0, 2).map((target) => target.id)).toEqual([20]);
  });

  test("chain targets preserve zombie array order and stop at chain count", () => {
    const zombies = [
      zombie({ id: 1 }),
      zombie({ id: 2, x: 1, z: 0 }),
      zombie({ id: 3, x: 0, z: 1 }),
      zombie({ id: 4, x: 1, z: 1 }),
    ];

    expect(
      getChainTargets(zombies, 1, 0, 0, 2).map((target) => target.id),
    ).toEqual([2, 3]);
  });

  test("dead zombies are skipped by chain targeting", () => {
    const zombies = [
      zombie({ id: 1 }),
      zombie({ id: 2, x: 1, dead: true }),
      zombie({ id: 3, x: 0, z: 1 }),
    ];

    expect(getChainTargets(zombies, 1, 0, 0, 1).map((target) => target.id)).toEqual([3]);
  });

  test("zero or negative chain count produces no targets", () => {
    const zombies = [zombie({ id: 1 }), zombie({ id: 2, x: 1 })];

    expect(getChainTargets(zombies, 1, 0, 0, 0)).toEqual([]);
    expect(getChainTargets(zombies, 1, 0, 0, -1)).toEqual([]);
  });
});
