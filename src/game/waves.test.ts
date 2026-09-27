import { describe, expect, test } from "bun:test";
import { getWaveSpawnPlan, waveIntensityBand } from "./waves";

describe("wave spawning rules", () => {
  test("maps stage progress into the existing intensity bands", () => {
    expect(waveIntensityBand(1, 6)).toBe(1);
    expect(waveIntensityBand(2, 6)).toBe(3);
    expect(waveIntensityBand(6, 6)).toBe(7);
    expect(waveIntensityBand(100, 6)).toBe(7);
  });

  test("returns the existing spawn pacing for an intensity band", () => {
    expect(getWaveSpawnPlan(1, 6)).toEqual({
      band: 1,
      sizeMultiplier: 1,
      intervalMultiplier: 1,
      batchSize: 1,
      clearDelay: 0.55,
    });

    expect(getWaveSpawnPlan(6, 6)).toEqual({
      band: 7,
      sizeMultiplier: 1.95,
      intervalMultiplier: 0.45,
      batchSize: 3,
      clearDelay: 0.2,
    });
  });

  test("clamps invalid stage targets without throwing", () => {
    expect(getWaveSpawnPlan(1, 0)).toEqual({
      band: 7,
      sizeMultiplier: 1.95,
      intervalMultiplier: 0.45,
      batchSize: 3,
      clearDelay: 0.2,
    });
  });
});
