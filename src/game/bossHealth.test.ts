import { describe, expect, test } from "bun:test";
import { getBossHealthSummary, getBossStatusFlags } from "./bossHealth";

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

describe("boss status flags", () => {
  test("reports statuses on live bosses only", () => {
    const base = { hp: 100, maxHp: 100, dead: false, boss: true, burn: 0, slow: 0 };
    const flags = getBossStatusFlags([
      { ...base, markTime: 2, burn: 4 },
      { ...base, hp: 10, stun: 0.2, bossEnraged: true },
      { ...base, dead: true, slow: 0.5 },
      { ...base, boss: false, slow: 0.5 },
    ]);
    expect(flags).toEqual({ enraged: true, marked: true, stunned: true, burning: true, slowed: false, vulnerable: true });
  });
});
