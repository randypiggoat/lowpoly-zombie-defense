import { describe, expect, test } from "bun:test";
import { STORE_CATALOG, storeItemStatus } from "./storeCatalog";

describe("store catalog", () => {
  test("contains only the supported monetization products", () => {
    expect(STORE_CATALOG.map((entry) => entry.product)).toEqual([
      "remove-ads",
      "supporter-pack",
      "cosmetic-pack",
    ]);
  });

  test("never presents an unavailable product as purchasable", () => {
    expect(storeItemStatus(false, false)).toBe("MOBILE STORE");
    expect(storeItemStatus(true, false)).toBe("AVAILABLE");
    expect(storeItemStatus(false, true)).toBe("OWNED");
  });
});
