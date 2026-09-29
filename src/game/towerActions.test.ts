import { describe, expect, test } from "bun:test";
import {
  canBuyTier,
  tierCost,
  towerSellValue,
  towerUpgradeCost,
} from "./towerActions";

const definition = {
  cost: 40,
  upgradeBase: 30,
};

const paths = {
  a: {
    tiers: [
      { cost: 50 },
      { cost: 110 },
      { cost: 240 },
      { cost: 520 },
    ],
  },
  b: {
    tiers: [
      { cost: 45 },
      { cost: 100 },
      { cost: 230 },
      { cost: 500 },
    ],
  },
};

describe("tower action rules", () => {
  test("calculates level-up costs with the existing progression formula", () => {
    expect(towerUpgradeCost({ level: 1 }, definition, 8)).toBe(30);
    expect(towerUpgradeCost({ level: 2 }, definition, 8)).toBe(47);
    expect(towerUpgradeCost({ level: 8 }, definition, 8)).toBe(Infinity);
  });

  test("enforces the existing cross-path tier restriction", () => {
    expect(canBuyTier({ a: 0, b: 0 }, "a")).toBe(true);
    expect(canBuyTier({ a: 2, b: 2 }, "a")).toBe(true);
    expect(canBuyTier({ a: 2, b: 3 }, "a")).toBe(false);
    expect(canBuyTier({ a: 3, b: 2 }, "b")).toBe(false);
    expect(canBuyTier({ a: 3, b: 3 }, "b")).toBe(false);
    expect(canBuyTier({ a: 4, b: 0 }, "a")).toBe(false);
  });

  test("returns the current tier cost and infinity after four tiers", () => {
    expect(tierCost({ kind: "rifleman", a: 0, b: 0 }, "a", paths)).toBe(50);
    expect(tierCost({ kind: "rifleman", a: 2, b: 0 }, "a", paths)).toBe(240);
    expect(tierCost({ kind: "rifleman", a: 4, b: 0 }, "a", paths)).toBe(Infinity);
  });

  test("calculates 60 percent tower resale value from total spent", () => {
    const tower = { kind: "rifleman", level: 3, a: 2, b: 1 };
    const spent = 40 + 50 + 110 + 45;
    expect(towerSellValue(tower, definition, paths, 8)).toBe(
      Math.floor(spent * 0.6),
    );
  });

  test("resale value includes all purchased levels and tiers", () => {
    const base = towerSellValue(
      { kind: "rifleman", level: 1, a: 0, b: 0 },
      definition,
      paths,
      8,
    );
    const upgraded = towerSellValue(
      { kind: "rifleman", level: 2, a: 1, b: 1 },
      definition,
      paths,
      8,
    );

    expect(base).toBe(24);
    expect(upgraded).toBe(Math.floor((40 + 50 + 45) * 0.6));
  });
});
