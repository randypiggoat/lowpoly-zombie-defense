import { describe, expect, test } from "bun:test";
import { rifleSquadDamageBonus, rifleSquadRangeBonus, type Tower } from "./engine";

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
  test("support buffs only nearby Riflemen with damage and range", () => {
    const rifleman = tower(1, "rifleman", 0);
    const squadLeader = tower(2, "rifleman", 2, 0, 3);
    const sniper = tower(3, "sniper", 2);
    const distantRifleman = tower(4, "rifleman", 12);
    const towers = [rifleman, squadLeader];

    expect(rifleSquadDamageBonus(rifleman, towers)).toBeCloseTo(0.1);
    expect(rifleSquadRangeBonus(rifleman, towers)).toBeCloseTo(0.04);
    expect(rifleSquadDamageBonus(sniper, [sniper, squadLeader])).toBe(0);
    expect(rifleSquadRangeBonus(sniper, [sniper, squadLeader])).toBe(0);
    expect(rifleSquadDamageBonus(distantRifleman, [distantRifleman, squadLeader])).toBe(0);
  });

  test("overlapping squad buffs use the strongest values and never stack", () => {
    const rifleman = tower(1, "rifleman", 0);
    const drill = tower(2, "rifleman", 1, 0, 3);
    const command = tower(3, "rifleman", -1, 0, 4);
    const towers = [rifleman, drill, command];

    expect(rifleSquadDamageBonus(rifleman, towers)).toBeCloseTo(0.15);
    expect(rifleSquadRangeBonus(rifleman, towers)).toBeCloseTo(0.08);
  });

  test("a support Rifleman does not receive its own aura", () => {
    const commander = tower(1, "rifleman", 0, 0, 4);
    expect(rifleSquadDamageBonus(commander, [commander])).toBe(0);
    expect(rifleSquadRangeBonus(commander, [commander])).toBe(0);
  });
});
