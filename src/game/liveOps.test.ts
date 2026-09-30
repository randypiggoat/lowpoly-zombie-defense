import { describe, expect, test } from "bun:test";
import { getSeasonalEvent, getSeasonalEventCycleKey } from "./liveOps";

describe("seasonal live ops", () => {
  test("event rotation is deterministic", () => {
    const a = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEvent(new Date("2026-09-26T12:00:00"));
    expect(a.id).toBe(b.id);
    expect(a.milestones).toHaveLength(7);
    expect(new Set(a.milestones.map((milestone) => milestone.id)).size).toBe(7);
  });

  test("cycle keys remain stable within an event", () => {
    const a = getSeasonalEventCycleKey(new Date("2026-09-26T12:00:00"));
    const b = getSeasonalEventCycleKey(new Date("2026-09-20T12:00:00"));
    expect(a).toBe(b);
  });
});

  test("rotation exposes multiple distinct event identities", () => {
    const ids = Array.from({ length: 4 }, (_, index) =>
      getSeasonalEvent(new Date(Date.UTC(2026, 0, 1 + index * 28 + 2))).id,
    );
    expect(new Set(ids).size).toBe(4);
  });
