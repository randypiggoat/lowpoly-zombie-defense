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
});
