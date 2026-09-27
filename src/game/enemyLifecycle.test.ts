import { describe, expect, test } from "bun:test";
import {
  shouldDespawnEnemy,
  stepEnemyRagdoll,
  stepLivingEnemy,
} from "./enemyLifecycle";

describe("enemy lifecycle", () => {
  test("living enemies tick burn, move with slow, and clear slow for the next frame", () => {
    const result = stepLivingEnemy({
      dist: 2,
      speed: 4,
      slow: 0.25,
      burn: 6,
      burnTime: 2,
      wobble: 1,
      dt: 0.5,
      pathLength: 20,
    });

    expect(result.wobble).toBe(7);
    expect(result.burnDamage).toBe(3);
    expect(result.burnTime).toBe(1.5);
    expect(result.burn).toBe(6);
    expect(result.slow).toBe(0);
    expect(result.dist).toBe(3.5);
    expect(result.reachedBase).toBe(false);
  });

  test("living enemies clear burn when the burn timer expires", () => {
    const result = stepLivingEnemy({
      dist: 0,
      speed: 1,
      slow: 0,
      burn: 10,
      burnTime: 0.2,
      wobble: 0,
      dt: 0.5,
      pathLength: 20,
    });

    expect(result.burnDamage).toBe(5);
    expect(result.burnTime).toBe(-0.3);
    expect(result.burn).toBe(0);
    expect(result.dist).toBe(0.5);
    expect(result.reachedBase).toBe(false);
  });

  test("living enemies cap slow at the existing 85% movement reduction", () => {
    const result = stepLivingEnemy({
      dist: 10,
      speed: 4,
      slow: 0.99,
      burn: 0,
      burnTime: 0,
      wobble: 0,
      dt: 0.5,
      pathLength: 20,
    });

    expect(result.dist).toBe(10.3);
  });

  test("living enemies report when they reach the base", () => {
    const result = stepLivingEnemy({
      dist: 9.5,
      speed: 2,
      slow: 0,
      burn: 0,
      burnTime: 0,
      wobble: 0,
      dt: 0.5,
      pathLength: 10,
    });

    expect(result.dist).toBe(10.5);
    expect(result.reachedBase).toBe(true);
  });

  test("dead enemies use the existing ragdoll gravity and bounce behavior", () => {
    const first = stepEnemyRagdoll(
      {
        fade: 0,
        x: 1,
        y: 1,
        z: 2,
        vx: 2,
        vy: 0,
        vz: -1,
        tilt: 0,
        spin: 2,
        roll: 0,
      },
      0.1,
    );

    expect(first.fade).toBeCloseTo(0.055);
    expect(first.x).toBeCloseTo(1.2);
    expect(first.y).toBeCloseTo(0.84);
    expect(first.z).toBeCloseTo(1.9);
    expect(first.vy).toBeCloseTo(-1.6);
    expect(first.tilt).toBeCloseTo(0.2);
    expect(first.roll).toBeCloseTo(0.12);

    const landed = stepEnemyRagdoll(
      {
        fade: 0.5,
        x: 0,
        y: 0.05,
        z: 0,
        vx: 2,
        vy: -3,
        vz: 4,
        tilt: 1,
        spin: 2,
        roll: 0,
      },
      0.1,
    );

    expect(landed.y).toBe(0);
    expect(landed.vy).toBeCloseTo(1.38);
    expect(landed.spin).toBeCloseTo(0.6);
    expect(landed.vx).toBeCloseTo(2 * Math.exp(-0.6));
    expect(landed.vz).toBeCloseTo(4 * Math.exp(-0.6));
  });

  test("dead enemies despawn only after the existing fade threshold", () => {
    expect(shouldDespawnEnemy(false, 2)).toBe(false);
    expect(shouldDespawnEnemy(true, 1.6)).toBe(false);
    expect(shouldDespawnEnemy(true, 1.6001)).toBe(true);
    expect(shouldDespawnEnemy(true, 2, 3)).toBe(false);
    expect(shouldDespawnEnemy(true, 3.01, 3)).toBe(true);
  });
});
