import { describe, expect, test } from "bun:test";
import {
  advanceTowerCooldown,
  createTowerProjectile,
  PROJECTILE_CHAIN_DAMAGE_MULTIPLIER,
  PROJECTILE_SPLASH_DAMAGE_MULTIPLIER,
  stepProjectile,
} from "./towerCombat";

describe("tower combat loop rules", () => {
  test("tower cooldown becomes ready when elapsed time reaches its current cooldown", () => {
    const cooling = advanceTowerCooldown(0.4, 0.1);
    expect(cooling.cooldown).toBeCloseTo(0.3);
    expect(cooling.ready).toBe(false);
    expect(advanceTowerCooldown(0.1, 0.1)).toEqual({
      cooldown: 0,
      ready: true,
    });
    expect(advanceTowerCooldown(0, 0.1)).toEqual({
      cooldown: -0.1,
      ready: true,
    });
  });

  test("tower projectile creation preserves combat stats and calculates launch height", () => {
    const projectile = createTowerProjectile({
      id: 17,
      x: 2,
      z: -4,
      tx: 8,
      tz: 3,
      speed: 22,
      damage: 12,
      target: 5,
      kind: "rifleman",
      splash: 0,
      chain: 0,
      slow: 0,
      burn: 0,
      gold: 1,
      crit: true,
      level: 4,
    });

    expect(projectile.id).toBe(17);
    expect(projectile.x).toBe(2);
    expect(projectile.z).toBe(-4);
    expect(projectile.y).toBeCloseTo(1.72);
    expect(projectile.tx).toBe(8);
    expect(projectile.tz).toBe(3);
    expect(projectile.speed).toBe(22);
    expect(projectile.damage).toBe(12);
    expect(projectile.target).toBe(5);
    expect(projectile.kind).toBe("rifleman");
    expect(projectile.splash).toBe(0);
    expect(projectile.chain).toBe(0);
    expect(projectile.slow).toBe(0);
    expect(projectile.burn).toBe(0);
    expect(projectile.gold).toBe(1);
    expect(projectile.crit).toBe(true);
    expect(projectile.markedDamageMultiplier).toBe(1);
    expect(projectile.slowedDamageMultiplier).toBe(1);
    expect(projectile.alive).toBe(true);
  });

  test("projectile homes onto a living target before checking impact distance", () => {
    const result = stepProjectile(
      {
        x: 0,
        z: 0,
        tx: 100,
        tz: 100,
        speed: 10,
        alive: true,
      },
      0.5,
      { x: 3, z: 4 },
    );

    expect(result).toEqual({
      x: 0,
      z: 0,
      tx: 3,
      tz: 4,
      alive: false,
      impacted: true,
    });
  });

  test("projectile moves toward its target when the target is outside this frame's travel distance", () => {
    const result = stepProjectile(
      {
        x: 0,
        z: 0,
        tx: 3,
        tz: 4,
        speed: 10,
        alive: true,
      },
      0.2,
      { x: 3, z: 4 },
    );

    expect(result.x).toBeCloseTo(1.2);
    expect(result.z).toBeCloseTo(1.6);
    expect(result.tx).toBe(3);
    expect(result.tz).toBe(4);
    expect(result.alive).toBe(true);
    expect(result.impacted).toBe(false);
  });

  test("projectile impacts when its target disappears", () => {
    const result = stepProjectile(
      {
        x: 1,
        z: 2,
        tx: 5,
        tz: 6,
        speed: 10,
        alive: true,
      },
      0.1,
      null,
    );

    expect(result).toEqual({
      x: 1,
      z: 2,
      tx: 5,
      tz: 6,
      alive: false,
      impacted: true,
    });
  });

  test("dead projectiles do not move or create a new impact", () => {
    const result = stepProjectile(
      {
        x: 1,
        z: 2,
        tx: 5,
        tz: 6,
        speed: 10,
        alive: false,
      },
      1,
      null,
    );

    expect(result).toEqual({
      x: 1,
      z: 2,
      tx: 5,
      tz: 6,
      alive: false,
      impacted: false,
    });
  });

  test("secondary damage multipliers preserve the existing impact rules", () => {
    expect(PROJECTILE_SPLASH_DAMAGE_MULTIPLIER).toBe(0.5);
    expect(PROJECTILE_CHAIN_DAMAGE_MULTIPLIER).toBe(0.6);
  });
});
