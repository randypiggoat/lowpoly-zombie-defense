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
  markSpreadRadius?: number;
  shatterMultiplier: number;
  executeThreshold: number;
  executeMultiplier: number;
  bossDamageMultiplier: number;
  closeDamageMultiplier: number;
  burnDuration: number;
  markedDamageMultiplier: number;
  slowedDamageMultiplier: number;
  stunnedMultiplier?: number;
  burningMultiplier?: number;
  swarmMultiplier?: number;
  burnSpread?: number;
  chainEscalation?: number;
  eliteDamageMultiplier?: number;
  precisionMultiplier?: number;
  fastDamageMultiplier?: number;
  killRush?: number;
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
  out: ProjectileFlightResult = {
    x: 0,
    z: 0,
    tx: 0,
    tz: 0,
    alive: false,
    impacted: false,
  },
): ProjectileFlightResult {
  if (!projectile.alive) {
    out.x = projectile.x;
    out.z = projectile.z;
    out.tx = projectile.tx;
    out.tz = projectile.tz;
    out.alive = false;
    out.impacted = false;
    return out;
  }

  const tx = target?.x ?? projectile.tx;
  const tz = target?.z ?? projectile.tz;
  const dx = tx - projectile.x;
  const dz = tz - projectile.z;
  const distance = Math.hypot(dx, dz);
  const step = projectile.speed * dt;

  // Preserve the projectile's current position on impact. The engine resolves
  // damage from the projectile's current x/z rather than snapping to the target.
  out.x = projectile.x;
  out.z = projectile.z;
  out.tx = tx;
  out.tz = tz;
  if (distance <= step || !target) {
    out.alive = false;
    out.impacted = true;
    return out;
  }

  out.x = projectile.x + (dx / distance) * step;
  out.z = projectile.z + (dz / distance) * step;
  out.alive = true;
  out.impacted = false;
  return out;
}

export const PROJECTILE_SPLASH_DAMAGE_MULTIPLIER = 0.5;
export const PROJECTILE_CHAIN_DAMAGE_MULTIPLIER = 0.6;

/** Distance (tiles) at which precision shots start to pay off. */
export const PRECISION_RANGE = 6;
/** Fire-rate window after a kill-rush kill, in seconds. */
export const KILL_RUSH_DURATION = 2;

const ELITE_KINDS = new Set([2, 5, 6]);
const FAST_KINDS = new Set([1, 7]);

export type ConditionalDamageInput = {
  enemyKind: number;
  boss: boolean;
  distanceFromTower: number;
  eliteDamageMultiplier?: number;
  precisionMultiplier?: number;
  fastDamageMultiplier?: number;
};

/** Situational damage from the elite / precision / fast-hunter abilities and matching modifiers. */
export function conditionalDamageMultiplier(input: ConditionalDamageInput): number {
  let multiplier = 1;
  if ((input.boss || ELITE_KINDS.has(input.enemyKind)) && input.eliteDamageMultiplier) {
    multiplier *= Math.max(1, input.eliteDamageMultiplier);
  }
  if (input.distanceFromTower >= PRECISION_RANGE && input.precisionMultiplier) {
    multiplier *= Math.max(1, input.precisionMultiplier);
  }
  if (FAST_KINDS.has(input.enemyKind) && !input.boss && input.fastDamageMultiplier) {
    multiplier *= Math.max(1, input.fastDamageMultiplier);
  }
  return multiplier;
}

/** Damage factor for the Nth chain jump (0-based), given an escalation per jump. */
export function chainJumpMultiplier(jumpIndex: number, escalation = 0): number {
  return PROJECTILE_CHAIN_DAMAGE_MULTIPLIER * (1 + Math.max(0, escalation) * (jumpIndex + 1));
}

/** Tint that makes a shot's status payload readable in flight. */
export function projectileStatusTint(
  shot: Pick<ProjectileState, "markDuration" | "burn" | "slow" | "stun" | "executeThreshold">,
  base: string,
): string {
  if (shot.executeThreshold > 0 && shot.markDuration > 0) return "#ff5a5a";
  if (shot.markDuration > 0) return "#ff8ad8";
  if (shot.burn > 0) return "#ffa23a";
  if (shot.slow > 0) return "#bdeaff";
  if (shot.stun > 0) return "#fff08a";
  return base;
}
