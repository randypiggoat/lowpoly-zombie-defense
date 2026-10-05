import { describe, expect, test } from "bun:test";
import { createBossTrialStage, getBossTrialVariant, getWeeklyBossTrial, BOSS_TRIAL_ROSTER } from "./bossTrials";

describe("boss trials", () => {
  test("contains six distinct boss archetype trials", () => {
    expect(BOSS_TRIAL_ROSTER).toHaveLength(6);
    expect(new Set(BOSS_TRIAL_ROSTER.map((trial) => trial.bossKind)).size).toBe(6);
    expect(new Set(BOSS_TRIAL_ROSTER.map((trial) => trial.id)).size).toBe(6);
  });

  test("weekly rotation is deterministic", () => {
    const first = getWeeklyBossTrial("2026-W40");
    const second = getWeeklyBossTrial("2026-W40");
    expect(first.id).toBe(second.id);
    expect(first.variant?.id).toBe(second.variant?.id);
  });

  test("variant selection changes deterministically with the week key", () => {
    const trial = BOSS_TRIAL_ROSTER[0]!;
    const a = getBossTrialVariant(trial, "2026-W40");
    const b = getBossTrialVariant(trial, "2026-W41");
    expect(a.id).toBeDefined();
    expect(b.id).toBeDefined();
  });

  test("creates an eight-wave hard stage with the selected boss", () => {
    const trial = getWeeklyBossTrial("2026-W40");
    const stage = createBossTrialStage(trial);
    expect(stage.bossTrial).toBe(true);
    expect(stage.bossTrialId).toBe(trial.id);
    expect(stage.waveCount).toBe(8);
    expect(stage.boss.wave).toBe(8);
    expect(stage.boss.kind).toBe(trial.bossKind);
    expect(stage.boss.count).toBe(1);
    expect(stage.difficulty).toBe("Hard");
  });
});
