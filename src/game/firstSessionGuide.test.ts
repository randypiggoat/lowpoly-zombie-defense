import { describe, expect, test } from "bun:test";
import { getFirstSessionTip } from "./firstSessionGuide";

describe("first session guidance", () => {
  test("starts with tower placement guidance", () => {
    expect(getFirstSessionTip(0, 0, 0, 0)).toMatchObject({
      title: "BUILD YOUR FIRST TOWER",
    });
  });

  test("moves to upgrade guidance after the first tower is built", () => {
    expect(getFirstSessionTip(0, 1, 1, 0)).toMatchObject({
      title: "UPGRADE YOUR DEFENSE",
    });
  });

  test("stops showing after the first run, not just a few waves", () => {
    expect(getFirstSessionTip(1, 0, 0, 0)).toBeNull();
    expect(getFirstSessionTip(0, 3, 2, 1)).toMatchObject({
      title: "YOU'RE READY",
    });
  });

  test("confirms the player is ready once the first upgrade is done", () => {
    expect(getFirstSessionTip(0, 2, 2, 1)).toMatchObject({
      title: "YOU'RE READY",
    });
  });

  test("teaches tower paths after the first upgrade", () => {
    expect(getFirstSessionTip(0, 1, 1, 1, { pathUpgradeCount: 1 })).toMatchObject({
      title: "TOWER PATHS",
    });
  });

  test("explains a visible special enemy", () => {
    expect(getFirstSessionTip(0, 2, 1, 1, { specialEnemyLabel: "BRUTE" })).toMatchObject({
      title: "SPOT THE BRUTE",
      body: expect.stringContaining("hit the base hard"),
    });
  });

  test("points to the next progression target", () => {
    expect(
      getFirstSessionTip(0, 1, 1, 1, {
        progressionTarget: { label: "Field Drills", detail: "20 credits to Field Knowledge" },
      }),
    ).toMatchObject({
      title: "NEXT PROGRESSION TARGET",
      body: expect.stringContaining("Field Drills"),
    });
  });
});
