import { describe, expect, test } from "bun:test";
import {
  SEASONAL_EVENTS,
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
    expect(getSeasonalMilestoneProgress(killMilestone, 900, { waves: 4 })).toBe(killMilestone.target);
  });

  test("events keep saved milestone ids but play differently", () => {
    const blood = SEASONAL_EVENTS.find((event) => event.id === "blood-harvest")!;
    const frost = SEASONAL_EVENTS.find((event) => event.id === "frozen-night")!;
    expect(blood.milestones.map((m) => m.id.split("-").slice(1).join("-"))).toEqual(
      frost.milestones.map((m) => m.id.split("-").slice(1).join("-")),
    );
    expect(blood.milestones[0]!.activity).not.toBe(frost.milestones[0]!.activity);
    expect(blood.milestones.at(-1)!.cosmeticId).not.toBe(frost.milestones.at(-1)!.cosmeticId);
    for (const event of SEASONAL_EVENTS) {
      expect(event.milestones.length).toBeGreaterThanOrEqual(6);
      expect(event.milestones.length).toBeLessThanOrEqual(8);
      expect(event.milestones.filter((m) => m.activity === "kills").length).toBeLessThanOrEqual(2);
      expect(new Set(event.milestones.map((m) => m.activity)).size).toBeGreaterThanOrEqual(4);
    }
  });
});
