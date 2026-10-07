export type LivingEnemyStepInput = {
  dist: number;
  speed: number;
  slow: number;
  burn: number;
  burnTime: number;
  stun?: number;
  markTime?: number;
  markBonus?: number;
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
  markBonus: number;
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
  out: LivingEnemyStepResult = {
    dist: 0,
    slow: 0,
    burn: 0,
    burnTime: 0,
    stun: 0,
    markTime: 0,
    markBonus: 0,
    wobble: 0,
    burnDamage: 0,
    reachedBase: false,
  },
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
  const nextStun = Math.max(0, (input.stun ?? 0) - dt);
  const nextMarkTime = Math.max(0, (input.markTime ?? 0) - dt);
  const nextMarkBonus = nextMarkTime > 0 ? input.markBonus ?? 0 : 0;
  let burnDamage = 0;

  if (nextBurnTime > 0 && nextBurn > 0) {
    nextBurnTime -= dt;
    burnDamage = nextBurn * dt;
  }

  const rawNextDist =
    dist + speed * dt * (nextStun > 0 ? 0 : 1 - Math.min(0.85, slow));
  const nextDist = Math.min(Math.max(0, pathLength), rawNextDist);

  if (nextBurnTime <= 0) nextBurn = 0;

  out.dist = nextDist;
  out.slow = 0;
  out.burn = nextBurn;
  out.burnTime = nextBurnTime;
  out.stun = nextStun;
  out.markTime = nextMarkTime;
  out.markBonus = nextMarkBonus;
  out.wobble = nextWobble;
  out.burnDamage = burnDamage;
  out.reachedBase = nextDist >= pathLength;
  return out;
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
  out: EnemyRagdollState = { ...state },
): EnemyRagdollState {
  const nextVy = state.vy - 16 * dt;
  out.fade = state.fade + dt * 0.55;
  out.x = state.x + state.vx * dt;
  out.y = state.y + nextVy * dt;
  out.z = state.z + state.vz * dt;
  out.vx = state.vx;
  out.vy = nextVy;
  out.vz = state.vz;
  out.tilt = state.tilt + state.spin * dt;
  out.spin = state.spin;
  out.roll = state.roll + state.spin * 0.6 * dt;

  if (out.y <= 0) {
    out.y = 0;
    if (out.vy < -0.4) {
      out.vy = -out.vy * 0.3;
      out.spin *= 0.4;
    } else {
      out.vy = 0;
      out.spin *= Math.exp(-8 * dt);
    }
    out.vx *= Math.exp(-6 * dt);
    out.vz *= Math.exp(-6 * dt);
  }

  return out;
}

export function shouldDespawnEnemy(
  dead: boolean,
  fade: number,
  fadeThreshold = 1.6,
): boolean {
  return dead && fade > fadeThreshold;
}
