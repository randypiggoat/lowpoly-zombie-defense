import { describe, expect, test } from "bun:test";
import { Game } from "./engine";
import { getDailyChallenge, getWeeklyChallenge, getWeekKey } from "./endless";

describe("endless engine", () => {
  test("starts as an endless run and carries challenge metadata", () => {
    const game = new Game(() => 0.5);
    const challenge = getDailyChallenge("2026-09-27");
    game.startEndless(challenge, "2026-09-27");

    expect(game.state.endlessMode).toBe(true);
    expect(game.state.stageWaveTarget).toBe(50);
    expect(game.state.challengeId).toBe(challenge.id);
    expect(game.state.challengePeriod).toBe("daily");
    expect(game.state.challengeKey).toBe("2026-09-27");
  });

  test("weekly challenge uses a deterministic week key", () => {
    const key = getWeekKey(new Date("2026-09-27T12:00:00"));
    const challenge = getWeeklyChallenge(key);

    expect(challenge.period).toBe("weekly");
    expect(challenge.id).toBe(getWeeklyChallenge(key).id);
  });
});
