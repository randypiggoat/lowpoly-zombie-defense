import { describe, expect, it } from "vitest";
import {
  isTowerUnlocked,
  nextTowerUnlock,
  progressionXpForKill,
  progressionXpForRun,
  progressionXpForWave,
  towerUnlockLevel,
} from "./progression";

describe("progression", () => {
  it("keeps the first three towers available at the start", () => {
    expect(isTowerUnlocked("rifleman", 1)).toBe(true);
    expect(isTowerUnlocked("shotgunner", 1)).toBe(true);
    expect(isTowerUnlocked("freezer", 1)).toBe(true);
    expect(isTowerUnlocked("sniper", 1)).toBe(false);
  });

  it("spaces advanced tower unlocks across account levels", () => {
    expect(towerUnlockLevel("sniper")).toBe(3);
    expect(towerUnlockLevel("tesla")).toBe(5);
    expect(towerUnlockLevel("flamethrower")).toBe(7);
    expect(towerUnlockLevel("rocket")).toBe(9);
    expect(towerUnlockLevel("laser")).toBe(12);
    expect(nextTowerUnlock(1)?.kind).toBe("sniper");
  });

  it("allows an explicit legacy/purchased unlock without flattening the new level curve", () => {
    expect(isTowerUnlocked("laser", 1, ["laser"])).toBe(true);
    expect(isTowerUnlocked("laser", 1)).toBe(false);
  });

  it("keeps a first run from awarding an entire roster", () => {
    expect(progressionXpForRun(16, 120)).toBe(254);
    expect(progressionXpForWave(16)).toBe(35);
    expect(progressionXpForKill(0)).toBe(1);
    expect(progressionXpForKill(2)).toBe(2);
  });
});
