import type { TowerKind } from "./engine";

export type TowerCombatCooldown = {
  cooldown: number;
  ready: boolean;
};

export function advanceTowerCooldown(
  cooldown: number,
  dt: number,
): TowerCombatCooldown {
  const nextCooldown = cooldown - dt;
  return {
    cooldown: nextCooldown,
    ready: nextCooldown <= 0,
  };
}

export type ProjectileState = {
  id: number;
  x: number;
  z: number;
  y: number;
  tx: number;
  tz: number;
  speed: number;
  damage: number;
  target: number;
  kind: TowerKind;
  splash: number;
  chain: number;
  slow: number;
  burn: number;
  gold: number;
  crit: boolean;
  alive: boolean;
  originX: number;
  originZ: number;
  stun: number;
  markDuration: number;
  markBonus: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
  markedDamageMultiplier: number;
  slowedDamageMultiplier: number;
};

export type ProjectileLaunchInput = Omit<
  ProjectileState,
  "alive" | "y" | "markedDamageMultiplier" | "slowedDamageMultiplier"
> & {
  level: number;
  markedDamageMultiplier?: number;
  slowedDamageMultiplier?: number;
};

export function createTowerProjectile(
  input: ProjectileLaunchInput,
): ProjectileState {
  const {
    level,
    markedDamageMultiplier = 1,
    slowedDamageMultiplier = 1,
    ...projectile
  } = input;
  return {
    ...projectile,
    markedDamageMultiplier,
    slowedDamageMultiplier,
    y: 1.6 + level * 0.03,
    alive: true,
  };
}

export type ProjectileFlightResult = {
  x: number;
  z: number;
  tx: number;
  tz: number;
  alive: boolean;
  impacted: boolean;
};

export function stepProjectile(
  projectile: Pick<
    ProjectileState,
    "x" | "z" | "tx" | "tz" | "speed" | "alive"
  >,
  dt: number,
  target: { x: number; z: number } | null,
): ProjectileFlightResult {
  if (!projectile.alive) {
    return {
      x: projectile.x,
      z: projectile.z,
      tx: projectile.tx,
      tz: projectile.tz,
      alive: false,
      impacted: false,
    };
  }

  const tx = target?.x ?? projectile.tx;
  const tz = target?.z ?? projectile.tz;
  const dx = tx - projectile.x;
  const dz = tz - projectile.z;
  const distance = Math.hypot(dx, dz);
  const step = projectile.speed * dt;

  // Preserve the projectile's current position on impact. The original engine
  // marks it dead here and resolves damage from b.x/b.z rather than snapping it.
  if (distance <= step || !target) {
    return {
      x: projectile.x,
      z: projectile.z,
      tx,
      tz,
      alive: false,
      impacted: true,
    };
  }

  return {
    x: projectile.x + (dx / distance) * step,
    z: projectile.z + (dz / distance) * step,
    tx,
    tz,
    alive: true,
    impacted: false,
  };
}

export const PROJECTILE_SPLASH_DAMAGE_MULTIPLIER = 0.5;
export const PROJECTILE_CHAIN_DAMAGE_MULTIPLIER = 0.6;
