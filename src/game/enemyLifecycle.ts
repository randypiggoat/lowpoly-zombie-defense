export type LivingEnemyStepInput = {
  dist: number;
  speed: number;
  slow: number;
  burn: number;
  burnTime: number;
  stun?: number;
  markTime?: number;
  wobble: number;
  dt: number;
  pathLength: number;
};

export type LivingEnemyStepResult = {
  dist: number;
  slow: number;
  burn: number;
  burnTime: number;
  stun: number;
  markTime: number;
  wobble: number;
  burnDamage: number;
  reachedBase: boolean;
};

/**
 * Advance a living enemy by one fixed simulation step.
 *
 * This preserves the engine's existing order:
 * 1. advance wobble
 * 2. tick burn and expose its damage
 * 3. move along the path using the current slow value
 * 4. clear slow for the next frame
 */
export function stepLivingEnemy(
  input: LivingEnemyStepInput,
): LivingEnemyStepResult {
  const {
    dist,
    speed,
    slow,
    burn,
    burnTime,
    wobble,
    dt,
    pathLength,
  } = input;

  const nextWobble = wobble + dt * (4 + speed * 2);
  let nextBurnTime = burnTime;
  let nextBurn = burn;
  const nextStun = Math.max(0, input.stun - dt);
  const nextMarkTime = Math.max(0, input.markTime - dt);
  let burnDamage = 0;

  if (nextBurnTime > 0 && nextBurn > 0) {
    nextBurnTime -= dt;
    burnDamage = nextBurn * dt;
  }

  const nextDist =
    dist + speed * dt * (nextStun > 0 ? 0 : 1 - Math.min(0.85, slow));

  if (nextBurnTime <= 0) {
    nextBurn = 0;
  }

  return {
    dist: nextDist,
    slow: 0,
    burn: nextBurn,
    burnTime: nextBurnTime,
    stun: nextStun,
    markTime: nextMarkTime,
    wobble: nextWobble,
    burnDamage,
    reachedBase: nextDist >= pathLength,
  };
}

export type EnemyRagdollState = {
  fade: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tilt: number;
  spin: number;
  roll: number;
};

/**
 * Advance a dead enemy's ragdoll using the engine's existing physics.
 */
export function stepEnemyRagdoll(
  state: EnemyRagdollState,
  dt: number,
): EnemyRagdollState {
  const nextVy = state.vy - 16 * dt;
  const next = {
    fade: state.fade + dt * 0.55,
    x: state.x + state.vx * dt,
    y: state.y + nextVy * dt,
    z: state.z + state.vz * dt,
    vx: state.vx,
    vy: nextVy,
    vz: state.vz,
    tilt: state.tilt + state.spin * dt,
    spin: state.spin,
    roll: state.roll + state.spin * 0.6 * dt,
  };

  if (next.y <= 0) {
    next.y = 0;
    if (next.vy < -0.4) {
      next.vy = -next.vy * 0.3;
      next.spin *= 0.4;
    } else {
      next.vy = 0;
      next.spin *= Math.exp(-8 * dt);
    }
    next.vx *= Math.exp(-6 * dt);
    next.vz *= Math.exp(-6 * dt);
  }

  return next;
}

export function shouldDespawnEnemy(
  dead: boolean,
  fade: number,
  fadeThreshold = 1.6,
): boolean {
  return dead && fade > fadeThreshold;
}
