import { describe, expect, it } from "vitest";
import {
  isTowerUnlocked,
  nextTowerUnlock,
  progressionXpForKill,
  progressionXpForRun,
  progressionXpForWave,
  towerUnlockLevel,
  xpForLevel,
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
    expect(progressionXpForRun(16, 120)).toBe(134);
    expect(progressionXpForWave(16)).toBe(17);
    expect(progressionXpForKill(0)).toBe(1);
    expect(progressionXpForKill(2)).toBe(2);
  });

  const levelForTotalXp = (total: number) => {
    let level = 1;
    let remaining = total;
    while (remaining >= xpForLevel(level)) {
      remaining -= xpForLevel(level);
      level += 1;
    }
    return level;
  };
  const firstClearXp = () => {
    let xp = progressionXpForRun(16, 150) + 120 + 80;
    for (let wave = 1; wave <= 16; wave += 1) xp += progressionXpForWave(wave);
    return xp + 150 + 20;
  };

  it("gives a normal first stage clear a meaningful but single-tower unlock", () => {
    const level = levelForTotalXp(firstClearXp());
    expect(firstClearXp()).toBeGreaterThan(500);
    expect(level).toBeGreaterThanOrEqual(towerUnlockLevel("sniper"));
    expect(level).toBeLessThan(towerUnlockLevel("tesla"));
  });

  it("cannot unlock the full roster from a single normal run, even with bonus XP", () => {
    const level = levelForTotalXp(firstClearXp() + 320);
    expect(level).toBeLessThan(towerUnlockLevel("flamethrower"));
    expect(nextTowerUnlock(level)).not.toBeNull();
  });

  it("unlocks towers gradually over the first several sessions without excessive grind", () => {
    const run = firstClearXp();
    expect(levelForTotalXp(run * 3)).toBeGreaterThanOrEqual(towerUnlockLevel("tesla"));
    expect(levelForTotalXp(run * 3)).toBeLessThan(towerUnlockLevel("rocket"));
    expect(levelForTotalXp(run * 20)).toBeGreaterThanOrEqual(towerUnlockLevel("laser"));
  });
});
