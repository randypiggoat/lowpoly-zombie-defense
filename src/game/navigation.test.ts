import { describe, expect, test } from "bun:test";
import {
  CAMPAIGN_REPLAY_CHALLENGES,
  STAGE_DEFS,
  campaignReplayProgressKey,
  evaluateStageObjectives,
  getNextStageId,
  getStageById,
  type StageObjectiveDefinition,
} from "./navigation";

describe("campaign progression", () => {
  test("campaign contains twenty stages across four worlds", () => {
    expect(STAGE_DEFS).toHaveLength(20);
    expect(new Set(STAGE_DEFS.map((stage) => stage.worldId))).toEqual(new Set([1, 2, 3, 4]));
    expect(new Set(STAGE_DEFS.map((stage) => stage.mapId)).size).toBe(20);
    expect(getStageById(20).name).toBe("Blacksite Omega");
    expect(getNextStageId(20)).toBeNull();
  });

  test("campaign unlocks in order", () => {
    expect(STAGE_DEFS[0]!.unlockRequirement).toEqual({ type: "none" });
    for (let index = 1; index < STAGE_DEFS.length; index += 1) {
      expect(STAGE_DEFS[index]!.unlockRequirement).toEqual({
        type: "complete-stage",
        stageId: STAGE_DEFS[index - 1]!.id,
      });
    }
  });

  test("campaign mastery objectives use varied replay goals", () => {
    const signatures = STAGE_DEFS.map((stage) =>
      stage.objectives.map((objective) => objective.type).join("|"),
    );
    expect(new Set(signatures).size).toBeGreaterThan(3);
  });

  test("campaign replay challenges have distinct restrictions and stable stage keys", () => {
    const [thinLine, noPowers] = CAMPAIGN_REPLAY_CHALLENGES;
    expect(CAMPAIGN_REPLAY_CHALLENGES).toHaveLength(4);
    expect(thinLine?.maxTowers).toBe(4);
    expect(noPowers?.allowRunModifiers).toBe(false);
    expect(campaignReplayProgressKey(3, thinLine!.id)).not.toBe(
      campaignReplayProgressKey(4, thinLine!.id),
    );
  });

  test("kill streak mastery reads the run's maximum streak", () => {
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

  test("tower variety mastery counts unique tower kinds", () => {
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

  test("mastery goals never award stars after a failed run", () => {
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
