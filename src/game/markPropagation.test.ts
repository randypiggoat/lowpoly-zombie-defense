import { describe, expect, test } from "bun:test";
import { applyTargetMark, spreadMarkOnDeath, type MarkPropagationTarget } from "./markPropagation";

function target(overrides: Partial<MarkPropagationTarget> & Pick<MarkPropagationTarget, "id" | "x" | "z">): MarkPropagationTarget {
  const { id, x, z, dead = false, ...state } = overrides;
  return { id, x, z, dead, ...state };
}

describe("support target marks", () => {
  test("marked kills pass a bounded mark to living enemies in range", () => {
    const fallen = target({ id: 1, x: 0, z: 0, dead: true, markTime: 3.5, markBonus: 0.2, markSpreadRadius: 2.4 });
    const near = target({ id: 2, x: 1, z: 1 });
    const outside = target({ id: 3, x: 2.1, z: 2.1 });
    const alreadyStronger = target({ id: 4, x: -1, z: 0, markTime: 5, markBonus: 0.22 });
    const alreadyDead = target({ id: 5, x: 0.2, z: 0.2, dead: true });
    const count = spreadMarkOnDeath(fallen, [fallen, near, outside, alreadyStronger, alreadyDead]);

    expect(count).toBe(2);
    expect(near.markTime).toBe(3.5);
    expect(near.markBonus).toBe(0.2);
    expect(near.markSpreadRadius).toBe(2.4);
    expect(alreadyStronger.markTime).toBe(5);
    expect(alreadyStronger.markBonus).toBe(0.22);
    expect(outside.markTime).toBeUndefined();
    expect(alreadyDead.markTime).toBeUndefined();
  });

  test("marks refresh by maximum value and cannot shorten or weaken a target call", () => {
    const zombie = target({ id: 1, x: 0, z: 0, markTime: 5, markBonus: 0.2, markSpreadRadius: 2.8 });
    applyTargetMark(zombie, 2, 0.12, 2.3);

    expect(zombie.markTime).toBe(5);
    expect(zombie.markBonus).toBe(0.2);
    expect(zombie.markSpreadRadius).toBe(2.8);
  });

  test("expired, unmarked, or non-propagating targets do not spread marks", () => {
    const near = target({ id: 2, x: 1, z: 0 });
    const expired = target({ id: 1, x: 0, z: 0, dead: true, markTime: 0, markBonus: 0.2, markSpreadRadius: 2.4 });
    const unmarked = target({ id: 3, x: 0, z: 0, dead: true });
    expect(spreadMarkOnDeath(expired, [near])).toBe(0);
    expect(spreadMarkOnDeath(unmarked, [near])).toBe(0);
    expect(near.markTime).toBeUndefined();
  });
});
