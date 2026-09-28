import { describe, expect, test } from "bun:test";
import { perfectWaveGoldBonus } from "./waveRewards";

describe("perfect wave rewards", () => {
  test("gives no bonus when the base takes damage", () => {
    expect(perfectWaveGoldBonus(4, 1)).toBe(0);
  });

  test("increases the bonus gradually with wave progression", () => {
    expect(perfectWaveGoldBonus(1, 0)).toBe(9);
    expect(perfectWaveGoldBonus(10, 0)).toBe(23);
  });

  test("caps late-game economy impact", () => {
    expect(perfectWaveGoldBonus(100, 0)).toBe(36);
  });
});
