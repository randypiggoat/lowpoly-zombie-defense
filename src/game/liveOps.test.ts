import { describe, expect, test } from "bun:test";
import { getSeasonalEvent, getSeasonalEventCycleKey } from "./liveOps";

describe("seasonal live ops", () => {
  test("event rotation is deterministic", () => {
    const a = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    expect(a.id).toBe(b.id);
    expect(a.milestones).toHaveLength(3);
  });

  test("cycle keys remain stable within an event", () => {
    const a = getSeasonalEventCycleKey(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEventCycleKey(new Date("2026-09-20T12:00:00"));
    expect(a).toBe(b);
  });
});
