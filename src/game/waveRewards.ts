export const PERFECT_WAVE_GOLD_CAP = 36;

/**
 * Rewards a cleanly defended wave with a small, deterministic gold burst.
 * The cap keeps the bonus meaningful without letting perfect play dominate the economy.
 */
export function perfectWaveGoldBonus(wave: number, damageTaken: number) {
  if (wave <= 0 || damageTaken > 0) return 0;
  return Math.min(PERFECT_WAVE_GOLD_CAP, 8 + Math.floor(wave * 1.5));
}
