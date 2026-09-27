export type ProjectileStatusState = {
  slow: number;
  burn: number;
  burnTime: number;
};

export function applyProjectileStatusEffects(
  current: ProjectileStatusState,
  slow: number,
  burn: number,
  burnDuration = 2.4,
): ProjectileStatusState {
  return {
    slow: slow > 0 ? Math.max(current.slow, slow) : current.slow,
    burn: burn > 0 ? Math.max(current.burn, burn) : current.burn,
    burnTime: burn > 0 ? Math.max(current.burnTime, burnDuration) : current.burnTime,
  };
}
