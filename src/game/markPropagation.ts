export type MarkPropagationTarget = {
  id: number;
  x: number;
  z: number;
  dead: boolean;
  markTime?: number;
  markBonus?: number;
  markSpreadRadius?: number;
};

/** Apply or refresh a target mark without letting weaker marks shorten stronger ones. */
export function applyTargetMark<T extends MarkPropagationTarget>(
  target: T,
  duration: number,
  bonus: number,
  spreadRadius = 0,
): void {
  if (!Number.isFinite(duration) || duration <= 0) return;
  target.markTime = Math.max(target.markTime ?? 0, duration);
  target.markBonus = Math.max(target.markBonus ?? 0, Math.max(0, bonus));
  if (Number.isFinite(spreadRadius) && spreadRadius > 0) {
    target.markSpreadRadius = Math.max(target.markSpreadRadius ?? 0, spreadRadius);
  }
}

/**
 * A marked enemy that dies passes its remaining mark to living enemies in range.
 * The radius is carried with the mark, so a later allied kill can still relay it.
 * This intentionally changes state in place and allocates no per-kill arrays.
 */
export function spreadMarkOnDeath<T extends MarkPropagationTarget>(
  fallen: T,
  candidates: readonly T[],
): number {
  const duration = Math.max(0, fallen.markTime ?? 0);
  const bonus = Math.max(0, fallen.markBonus ?? 0);
  const radius = Math.max(0, fallen.markSpreadRadius ?? 0);
  if (duration <= 0 || bonus <= 0 || radius <= 0) return 0;

  const radiusSquared = radius * radius;
  let spreadCount = 0;
  for (const candidate of candidates) {
    if (candidate.dead || candidate.id === fallen.id) continue;
    const dx = candidate.x - fallen.x;
    const dz = candidate.z - fallen.z;
    if (dx * dx + dz * dz > radiusSquared) continue;
    candidate.markTime = Math.max(candidate.markTime ?? 0, duration);
    candidate.markBonus = Math.max(candidate.markBonus ?? 0, bonus);
    candidate.markSpreadRadius = Math.max(candidate.markSpreadRadius ?? 0, radius);
    spreadCount += 1;
  }
  return spreadCount;
}
