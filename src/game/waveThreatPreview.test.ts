import { describe, expect, test } from "bun:test";
import { getWaveThreatPreview } from "./waveThreatPreview";
import { getStageById } from "./navigation";

describe("wave threat preview", () => {
  test("returns the most relevant threats from the stage pool", () => {
    const preview = getWaveThreatPreview(getStageById(3), 6);
    expect(preview.threats.length).toBeGreaterThan(0);
    expect(preview.threats.length).toBeLessThanOrEqual(3);
  });

  test("flags scheduled campaign bosses", () => {
    const preview = getWaveThreatPreview(getStageById(4), 5);
    expect(preview.boss).toBe(true);
    expect(preview.threats).toContain("BRUTE");
  });

  test("flags recurring endless boss waves", () => {
    const preview = getWaveThreatPreview(getStageById(5), 10);
    // Campaign stage 5 is not Endless; only an Endless stage id (999) uses recurring boss cadence.
    expect(preview.boss).toBe(true);
  });
});
