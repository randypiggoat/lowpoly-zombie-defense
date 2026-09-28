import { describe, expect, test } from "bun:test";
import { getBossHealthSummary } from "./bossHealth";

describe("boss health summary", () => {
  test("aggregates active true bosses", () => {
    expect(
      getBossHealthSummary([
        { hp: 50, maxHp: 100, dead: false, boss: true },
        { hp: 80, maxHp: 100, dead: false, boss: true },
        { hp: 40, maxHp: 100, dead: false, boss: false },
      ]),
    ).toEqual({
      currentHp: 130,
      maxHp: 200,
      ratio: 0.65,
      count: 2,
    });
  });

  test("ignores dead and non-boss enemies", () => {
    expect(
      getBossHealthSummary([
        { hp: 0, maxHp: 100, dead: true, boss: true },
        { hp: 20, maxHp: 100, dead: false, boss: false },
      ]),
    ).toBeNull();
  });
});
