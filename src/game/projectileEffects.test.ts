import { describe, expect, test } from "bun:test";
import { applyProjectileStatusEffects } from "./projectileEffects";

describe("projectile status effects", () => {
  test("applies slow without changing unrelated burn state", () => {
    expect(
      applyProjectileStatusEffects(
        { slow: 0.2, burn: 0, burnTime: 0 },
        0.5,
        0,
      ),
    ).toEqual({
      slow: 0.5,
      burn: 0,
      burnTime: 0,
    });
  });

  test("keeps the stronger existing slow", () => {
    expect(
      applyProjectileStatusEffects(
        { slow: 0.7, burn: 0, burnTime: 0 },
        0.5,
        0,
      ),
    ).toEqual({
      slow: 0.7,
      burn: 0,
      burnTime: 0,
    });
  });

  test("applies burn and refreshes burn duration", () => {
    expect(
      applyProjectileStatusEffects(
        { slow: 0, burn: 3, burnTime: 0.5 },
        0,
        7,
      ),
    ).toEqual({
      slow: 0,
      burn: 7,
      burnTime: 2.4,
    });
  });

  test("does not weaken existing burn or shorten its duration", () => {
    expect(
      applyProjectileStatusEffects(
        { slow: 0.25, burn: 9, burnTime: 4 },
        0.5,
        7,
      ),
    ).toEqual({
      slow: 0.5,
      burn: 9,
      burnTime: 4,
    });
  });

  test("allows a custom burn duration while preserving zero-effect inputs", () => {
    expect(
      applyProjectileStatusEffects(
        { slow: 0.1, burn: 2, burnTime: 1 },
        0,
        5,
        3.75,
      ),
    ).toEqual({
      slow: 0.1,
      burn: 5,
      burnTime: 3.75,
    });
  });
});
