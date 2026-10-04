import { describe, expect, test } from "bun:test";
import {
  getSeasonalEvent,
  getSeasonalEventCycleKey,
  getSeasonalMilestoneProgress,
} from "./liveOps";

describe("seasonal live ops", () => {
  test("event rotation is deterministic", () => {
    const a = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    expect(a.id).toBe(b.id);
    expect(a.milestones).toHaveLength(7);
    expect(new Set(a.milestones.map((milestone) => milestone.activity)).size).toBeGreaterThan(1);
  });

  test("cycle keys remain stable within an event", () => {
    const a = getSeasonalEventCycleKey(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEventCycleKey(new Date("2026-09-20T12:00:00"));
    expect(a).toBe(b);
  });

  test("event milestone progress reads the matching activity", () => {
    const event = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    const waveMilestone = event.milestones.find((milestone) => milestone.activity === "waves")!;
    const killMilestone = event.milestones.find((milestone) => milestone.activity === "kills")!;

    expect(getSeasonalMilestoneProgress(waveMilestone, 900, { waves: 4 })).toBe(4);
    expect(getSeasonalMilestoneProgress(killMilestone, 900, { waves: 4 })).toBe(250);
  });
});
