import { describe, expect, test } from "bun:test";
import { getWaveThreatPreview } from "./waveThreatPreview";
import { getStageById } from "./navigation";
import { ENDLESS_CHALLENGES, createEndlessStage } from "./endless";

describe("wave threat preview", () => {
  test("returns the most relevant threats from the stage pool", () => {
    const preview = getWaveThreatPreview(getStageById(3), 6);
    expect(preview.threats.length).toBeGreaterThan(0);
    expect(preview.threats.length).toBeLessThanOrEqual(3);
  });

  test("flags scheduled campaign bosses", () => {
    const preview = getWaveThreatPreview(getStageById(4), 9);
    expect(preview.boss).toBe(true);
    expect(preview.threats[0]).toBe("BRUTE");
  });

  test("flags recurring endless boss waves", () => {
    const endless = createEndlessStage(ENDLESS_CHALLENGES[0]!);
    const preview = getWaveThreatPreview(endless, 20);
    expect(preview.boss).toBe(true);
    expect(preview.threats[0]).toBe("BRUTE");
  });
});
