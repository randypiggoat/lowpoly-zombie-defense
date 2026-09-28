import { describe, expect, test } from "bun:test";
import {
  STAGE_DEFS,
  evaluateStageObjectives,
  type StageObjectiveDefinition,
} from "./navigation";

describe("campaign mastery objectives", () => {
  test("campaign stages use varied replay goals", () => {
    const signatures = STAGE_DEFS.slice(0, 5).map((stage) =>
      stage.objectives.map((objective) => objective.type).join("|"),
    );

    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  test("kill streak objectives use the recorded maximum streak", () => {
    const objective: StageObjectiveDefinition = {
      id: "kill-streak-10",
      label: "10 streak",
      type: "min-kill-streak",
      minStreak: 10,
    };

    expect(
      evaluateStageObjectives([objective], {
        stageCompleted: true,
        baseHealth: 20,
        baseMaxHealth: 20,
        towersPlaced: 4,
        maxKillStreak: 10,
        uniqueTowerKinds: 2,
      }).stars,
    ).toBe(1);
  });

  test("tower variety objectives count unique tower kinds", () => {
    const objective: StageObjectiveDefinition = {
      id: "tower-kinds-4",
      label: "4 types",
      type: "min-tower-kinds",
      minKinds: 4,
    };

    expect(
      evaluateStageObjectives([objective], {
        stageCompleted: true,
        baseHealth: 20,
        baseMaxHealth: 20,
        towersPlaced: 6,
        maxKillStreak: 2,
        uniqueTowerKinds: 4,
      }).stars,
    ).toBe(1);
  });

  test("mastery objectives cannot award stars after a failed run", () => {
    const objective: StageObjectiveDefinition = {
      id: "kill-streak-5",
      label: "5 streak",
      type: "min-kill-streak",
      minStreak: 5,
    };

    expect(
      evaluateStageObjectives([objective], {
        stageCompleted: false,
        baseHealth: 20,
        baseMaxHealth: 20,
        towersPlaced: 1,
        maxKillStreak: 20,
        uniqueTowerKinds: 4,
      }).stars,
    ).toBe(0);
  });
});
