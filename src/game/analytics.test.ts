import { describe, expect, test } from "bun:test";
import { clearAnalytics, getAnalyticsSnapshot, track } from "./analytics";

describe("analytics", () => {
  test("records gameplay events", () => {
    clearAnalytics();
    track("run_started", { stageId: 1 });
    expect(getAnalyticsSnapshot().at(-1)).toMatchObject({
      name: "run_started",
      payload: { stageId: 1 },
    });
  });

  test("accepts kill streak milestone events", () => {
    clearAnalytics();
    track("kill_streak_milestone", { streak: 10, goldMultiplier: 1.2 });
    expect(getAnalyticsSnapshot().at(-1)).toMatchObject({
      name: "kill_streak_milestone",
      payload: { streak: 10, goldMultiplier: 1.2 },
    });
  });
  test("records simulation speed changes", () => {
    clearAnalytics();
    track("simulation_speed_changed", { speed: 2 });
    expect(getAnalyticsSnapshot().at(-1)).toMatchObject({
      name: "simulation_speed_changed",
      payload: { speed: 2 },
    });
  });

});
