export type WaveIntensityBand = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WaveSpawnPlan = {
  band: WaveIntensityBand;
  sizeMultiplier: number;
  intervalMultiplier: number;
  batchSize: number;
  clearDelay: number;
};

const SIZE_MULTIPLIERS = [1, 1.1, 1.22, 1.38, 1.58, 1.76, 1.95] as const;
const INTERVAL_MULTIPLIERS = [1, 0.84, 0.72, 0.62, 0.56, 0.5, 0.45] as const;
const BATCH_SIZES = [1, 1, 2, 2, 2, 3, 3] as const;
const CLEAR_DELAYS = [0.55, 0.45, 0.38, 0.32, 0.28, 0.24, 0.2] as const;

/**
 * Converts a wave's progress through a stage into one of seven intensity bands.
 * This is intentionally pure so wave difficulty can be tested without the Game class.
 */
export function waveIntensityBand(wave: number, waveTarget: number): WaveIntensityBand {
  const normalized = Math.round((wave / Math.max(1, waveTarget)) * 20);

  if (normalized <= 3) return 1;
  if (normalized <= 6) return 2;
  if (normalized <= 9) return 3;
  if (normalized <= 10) return 4;
  if (normalized <= 15) return 5;
  if (normalized <= 19) return 6;
  return 7;
}

/**
 * Returns the presentation/spawn pacing rules for a wave.
 */
export function getWaveSpawnPlan(wave: number, waveTarget: number): WaveSpawnPlan {
  const band = waveIntensityBand(wave, waveTarget);
  const index = band - 1;

  return {
    band,
    sizeMultiplier: SIZE_MULTIPLIERS[index]!,
    intervalMultiplier: INTERVAL_MULTIPLIERS[index]!,
    batchSize: BATCH_SIZES[index]!,
    clearDelay: CLEAR_DELAYS[index]!,
  };
}
