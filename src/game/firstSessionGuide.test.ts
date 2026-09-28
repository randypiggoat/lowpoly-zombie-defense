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

  test("stops showing after the first run or early waves", () => {
    expect(getFirstSessionTip(1, 0, 0, 0)).toBeNull();
    expect(getFirstSessionTip(0, 3, 2, 1)).toBeNull();
  });

  test("confirms the player is ready once the first upgrade is done", () => {
    expect(getFirstSessionTip(0, 2, 2, 1)).toMatchObject({
      title: "YOU'RE READY",
    });
  });
});
