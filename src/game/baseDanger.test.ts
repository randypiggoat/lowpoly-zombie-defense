import { describe, expect, test } from "bun:test";
import { getBaseDangerLevel } from "./baseDanger";

describe("base danger presentation", () => {
  test("keeps healthy bases unobtrusive", () => {
    expect(getBaseDangerLevel(20, 20)).toBe("safe");
    expect(getBaseDangerLevel(12, 20)).toBe("safe");
  });

  test("warns before the base is critical", () => {
    expect(getBaseDangerLevel(10, 20)).toBe("warning");
    expect(getBaseDangerLevel(6, 20)).toBe("warning");
  });

  test("uses critical warning at quarter health or less", () => {
    expect(getBaseDangerLevel(5, 20)).toBe("critical");
    expect(getBaseDangerLevel(0, 20)).toBe("critical");
    expect(getBaseDangerLevel(0, 0)).toBe("critical");
  });

});
