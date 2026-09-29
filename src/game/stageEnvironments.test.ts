import { describe, expect, test } from "bun:test";
import { getStageEnvironment, STAGE_ENVIRONMENTS } from "./stageEnvironments";

describe("stage environment catalog", () => {
  test("every campaign stage has a themed environment", () => {
    const environments = Object.values(STAGE_ENVIRONMENTS);
    expect(environments).toHaveLength(20);
    expect(new Set(environments.map((environment) => environment.id)).size).toBe(20);

    for (const environment of environments) {
      expect(environment.label.length).toBeGreaterThan(3);
      expect(environment.props.length).toBeGreaterThanOrEqual(6);
      expect(environment.landmark.scale).toBeGreaterThan(0);
    }
  });

  test("environment lookup returns the same definition used by the catalog", () => {
    for (const environment of Object.values(STAGE_ENVIRONMENTS)) {
      expect(getStageEnvironment(environment.id)).toBe(environment);
    }
  });
});
