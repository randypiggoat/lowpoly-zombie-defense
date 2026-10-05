import { describe, expect, test } from "bun:test";
import { getSceneRenderQuality } from "./renderQuality";

describe("scene render quality", () => {
  test("uses the lightest scene profile on narrow mobile viewports", () => {
    expect(getSceneRenderQuality(390)).toEqual({
      shadowMapSize: 512,
      sceneryCount: 22,
    });
  });

  test("uses a balanced profile on tablet-sized viewports", () => {
    expect(getSceneRenderQuality(900)).toEqual({
      shadowMapSize: 768,
      sceneryCount: 30,
    });
  });

  test("keeps full visual detail on desktop", () => {
    expect(getSceneRenderQuality(1400)).toEqual({
      shadowMapSize: 768,
      sceneryCount: 38,
    });
  });
});
