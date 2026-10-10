import { describe, expect, test } from "bun:test";
import { rifleSquadRateBonus, type Tower } from "./engine";

function tower(id: number, kind: Tower["kind"], x: number, a = 0, b = 0): Tower {
  return {
    id,
    kind,
    spot: id,
    x,
    z: 0,
    level: 1 + a + b,
    a,
    b,
    targetMode: "first",
    cooldown: 0,
    aim: 0,
    recoil: 0,
  };
}

describe("Rifleman squad specialization", () => {
  test("support buffs only nearby Riflemen", () => {
    const rifleman = tower(1, "rifleman", 0);
    const squadLeader = tower(2, "rifleman", 2, 0, 3);
    const sniper = tower(3, "sniper", 2);
    const distantRifleman = tower(4, "rifleman", 12);

    expect(rifleSquadRateBonus(rifleman, [rifleman, squadLeader])).toBeCloseTo(0.12);
    expect(rifleSquadRateBonus(sniper, [sniper, squadLeader])).toBe(0);
    expect(rifleSquadRateBonus(distantRifleman, [distantRifleman, squadLeader])).toBe(0);
  });

  test("overlapping squad buffs use the strongest bonus and never stack", () => {
    const rifleman = tower(1, "rifleman", 0);
    const drill = tower(2, "rifleman", 1, 0, 3);
    const command = tower(3, "rifleman", -1, 0, 4);

    expect(rifleSquadRateBonus(rifleman, [rifleman, drill, command])).toBeCloseTo(0.15);
  });

  test("a support Rifleman does not receive its own aura", () => {
    const commander = tower(1, "rifleman", 0, 0, 4);
    expect(rifleSquadRateBonus(commander, [commander])).toBe(0);
  });
});
