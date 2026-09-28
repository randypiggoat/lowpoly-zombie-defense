import { Canvas } from "@react-three/fiber";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { HUD } from "./HUD";
import { Scene, type Selection } from "./Scene";
import { isMuted, setMuted, unlockAudio } from "@/game/audio";
import { TOWER_INFO, TOWER_KINDS, game } from "@/game/engine";
import {
  STAGE_DEFS,
  evaluateStageObjectives,
  getNextStageId,
  getStageById,
  stageUnlockRequirementText,
  type PrimaryScreen,
} from "@/game/navigation";
import { ACHIEVEMENT_DEFS, DAILY_MISSION_DEFS, dateKey, profile } from "@/game/profile";
import { TOWER_COSMETICS } from "@/game/collection";
import {
  createEndlessStage,
  ENDLESS_CHALLENGES,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeekKey,
  type EndlessChallenge,
} from "@/game/endless";
import { getSeasonalEvent, getSeasonalEventCycleKey, getSeasonalEventEnd } from "@/game/liveOps";
import { track } from "@/game/analytics";
import { isPurchaseAvailable, purchase } from "@/game/monetization";
import { STORE_CATALOG, storeItemStatus } from "@/game/storeCatalog";
import type { PurchaseProduct } from "@/game/monetization";
import { getWaveThreatPreview } from "@/game/waveThreatPreview";

function useGameSnapshot() {
  const [, force] = useState(0);
  useSyncExternalStore(
    (cb) => game.subscribe(cb),
    () => game.state.gold + game.state.wave * 1000,
    () => 0,
  );
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);
  return game.state;
}

function useProfileSnapshot() {
  useSyncExternalStore(
    (cb) => profile.subscribe(cb),
    () => profile.snapshot,
    () => 0,
  );
  return {
    player: profile.profile,
    lastReward: profile.lastReward,
  };
}

type Overlay = "pause" | "confirm-restart" | null;

type ScreenButtonProps = {
  children: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

function ScreenButton({ children, onClick, variant = "primary", disabled }: ScreenButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl px-4 py-3 text-base font-semibold tracking-wide transition active:scale-[0.98] disabled:opacity-40"
      style={{
        background: variant === "primary" ? "rgba(233,180,76,0.96)" : "rgba(29,36,48,0.9)",
        color: variant === "primary" ? "#20150a" : "#f2efe9",
      }}
    >
      {children}
    </button>
  );
}

function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel/95 p-4 shadow-panel backdrop-blur">
      {children}
    </div>
  );
}

function seasonalEventProgressTarget(target: number, progress: number) {
  return Math.min(target, Math.max(0, progress));
}

export function GameCanvas() {
  const state = useGameSnapshot();
  const { player, lastReward } = useProfileSnapshot();
  const [selection, setSelection] = useState<Selection>(null);
  const [screen, setScreen] = useState<PrimaryScreen>("main-menu");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settingsBackScreen, setSettingsBackScreen] = useState<PrimaryScreen>("main-menu");
  const [activeStageId, setActiveStageId] = useState(1);
  const [activeChallenge, setActiveChallenge] = useState<EndlessChallenge | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [canvasReady, setCanvasReady] = useState(false);
  const [rewardedAvailable, setRewardedAvailable] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<Partial<Record<PurchaseProduct, boolean>>>({});
  const activeStage = getStageById(activeStageId);
  const gameplayStage =
    state.endlessMode && activeChallenge
      ? createEndlessStage(activeChallenge)
      : activeStage;
  const waveThreatPreview =
    state.wave > 0 ? getWaveThreatPreview(gameplayStage, state.wave) : null;

  const stages = STAGE_DEFS.map((stage) => {
    const progress = player.stageProgress[String(stage.id)];
    const isUnlocked = progress?.unlocked ?? stage.id === 1;
    const bestWave = progress?.bestWave ?? 0;
    const completed = progress?.completed ?? false;
    const stars = progress?.stars ?? 0;
    return {
      ...stage,
      locked: !isUnlocked,
      requiredText: stageUnlockRequirementText(stage.unlockRequirement),
      bestWave,
      completed,
      stars,
    };
  });

  const recommendedStage =
    stages.find((stage) => !stage.completed && !stage.locked) ??
    stages.find((stage) => !stage.locked) ??
    stages[stages.length - 1]!;
  const isFirstRun = player.gamesPlayed === 0;
  const todayKey = dateKey();
  const dailyBonusAvailable =
    !player.adsRemoved && rewardedAvailable && profile.canClaimDailyRewardedBonus;
  const nextStageId = getNextStageId(activeStageId);
  const nextStage = nextStageId === null ? null : getStageById(nextStageId);

  const resetGameplayState = () => {
    profile.clearReward();
    game.reset();
    setSelection(null);
    setOverlay(null);
  };

  const startStage = (stageId: number) => {
    const stage = getStageById(stageId);
    const progress = player.stageProgress[String(stage.id)];
    const unlocked = progress?.unlocked ?? stage.id === 1;
    if (!unlocked) return;
    resetGameplayState();
    setActiveStageId(stageId);
    game.startStage(stage);
    setScreen("gameplay");
  };

  const leaveToStageSelect = () => {
    resetGameplayState();
    setScreen("stage-select");
  };

  const leaveToMainMenu = () => {
    resetGameplayState();
    setScreen("main-menu");
  };

  const openSettings = (backScreen: PrimaryScreen) => {
    setSettingsBackScreen(backScreen);
    setOverlay(null);
    setScreen("settings");
  };

  const closeSettings = useCallback(() => {
    if (settingsBackScreen === "gameplay") {
      setScreen("gameplay");
      setOverlay("pause");
      return;
    }
    setScreen(settingsBackScreen);
  }, [settingsBackScreen]);

  useEffect(() => {
    setCanvasReady(true);
    void import("@/game/monetization")
      .then(({ installCapacitorAdMobProvider, isRewardedAvailable }) => {
        installCapacitorAdMobProvider();
        setRewardedAvailable(isRewardedAvailable());
      })
      .catch(() => {
        setRewardedAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (screen === "gameplay" && state.gameOver) {
      setOverlay(null);
      setSelection(null);
      setScreen("results");
    }
  }, [screen, state.gameOver]);

  useEffect(() => {
    if (screen !== "results" || !state.gameOver || !lastReward) return;
    if (player.adsRemoved || player.gamesPlayed < 2) return;

    void import("@/game/monetization")
      .then(({ showInterstitial }) =>
        showInterstitial("run-complete", {
          now: Date.now(),
          inCombat: false,
          adsRemoved: player.adsRemoved,
        }),
      )
      .catch(() => false);
  }, [lastReward, player.adsRemoved, player.gamesPlayed, screen, state.gameOver]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (overlay === "confirm-restart") {
        setOverlay("pause");
        return;
      }
      if (overlay === "pause") {
        setOverlay(null);
        return;
      }
      if (screen === "settings") {
        closeSettings();
        return;
      }
      if (screen === "gameplay" && !state.gameOver) {
        setOverlay("pause");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSettings, overlay, screen, state.gameOver]);

  const paused = screen !== "gameplay" || overlay !== null;
  const resultLabel = state.endlessMode
    ? "SIEGE OVER"
    : state.stageWon
      ? "STAGE COMPLETE"
      : "GAME OVER";

  const endlessBestDisplay = state.challengePeriod === "daily"
    ? player.dailyChallengeBestScore
    : state.challengePeriod === "weekly"
      ? player.weeklyChallengeBestScore
      : player.endlessBestScore;

  const weekKey = getWeekKey();
  const dailyChallenge = getDailyChallenge(todayKey);
  const weeklyChallenge = getWeeklyChallenge(weekKey);
  const seasonalEvent = getSeasonalEvent();
  const seasonalCycleKey = getSeasonalEventCycleKey();
  const seasonalEventEnd = getSeasonalEventEnd();

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky" onPointerDown={() => unlockAudio()}>
      {canvasReady && (
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [2, 26, 30], fov: 40 }}
          onCreated={({ gl }) => {
            gl.setClearColor("#8fc4d8");
          }}
          onPointerMissed={() => setSelection(null)}
        >
          <Scene
            stageId={state.stageId}
            endlessMode={state.endlessMode}
            paused={paused}
            reducedMotion={player.reducedMotion}
            towers={state.towers}
            selection={selection}
            onSelectTower={(id) => setSelection({ kind: "tower", id })}
            onSelectSpot={(index) => setSelection({ kind: "spot", index })}
          />
        </Canvas>
      )}

      {screen === "gameplay" && (
        <>
          <HUD
            state={state}
            selection={selection}
            onSelect={setSelection}
            onPause={() => setOverlay("pause")}
            rewardedAvailable={rewardedAvailable}
            waveThreatPreview={waveThreatPreview}
            reducedMotion={player.reducedMotion}
            showMetaSections={false}
            showGameOverOverlay={false}
          />
        </>
      )}

      {screen === "main-menu" && (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3">
          <ScreenCard>
            <h1 className="text-center font-display text-3xl tracking-wide text-panel-foreground">
              Rotwood Defense
            </h1>
            <p className="mt-1 text-center text-sm text-panel-muted">
              Low-poly zombie tower defense
            </p>
            <div className="mt-4 space-y-2">
              <ScreenButton
                onClick={() => {
                  resetGameplayState();
                  setActiveStageId(recommendedStage.id);
                  if (isFirstRun) {
                    track("menu_quick_play", { stageId: recommendedStage.id });
                  }
                  game.startStage(recommendedStage);
                  setScreen("gameplay");
                }}
              >
                {isFirstRun ? "DEFEND NOW" : "CONTINUE · STAGE " + recommendedStage.stageNumber}
              </ScreenButton>
              <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-panel-muted">
                  {isFirstRun
                    ? "Start the first defense immediately"
                    : recommendedStage.name + " · Best wave " + recommendedStage.bestWave}
                </p>
                <p className="mt-0.5 text-xs text-panel-foreground">
                  {isFirstRun
                    ? "Build your first tower, then survive the first wave."
                    : recommendedStage.completed
                      ? "Replay your strongest unlocked stage and chase more stars."
                      : "Pick up where you left off and push the next stage."}
                </p>
              </div>
              {player.adsRemoved ? null : (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm tracking-wide text-panel-foreground">
                        DAILY BONUS
                      </p>
                      <p className="text-[10px] text-panel-muted">
                        Optional ad · +150 coins +1 gem
                      </p>
                    </div>
                    {dailyBonusAvailable ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const { showRewarded } = await import("@/game/monetization");
                          const earned = await showRewarded("daily-bonus");
                          if (earned && profile.claimDailyRewardedBonus()) {
                            track("daily_rewarded_bonus_claimed", {
                              coins: 150,
                              gems: 1,
                            });
                          }
                        }}
                        className="shrink-0 rounded-xl bg-accent px-3 py-2 font-display text-[11px] tracking-wide text-accent-foreground transition active:scale-[0.98]"
                      >
                        WATCH AD
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-xl bg-white/5 px-3 py-2 text-[10px] uppercase tracking-wider text-panel-muted">
                        {profile.canClaimDailyRewardedBonus ? "AD UNAVAILABLE" : "CLAIMED"}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <ScreenButton onClick={() => setScreen("stage-select")} variant="secondary">
                CAMPAIGN
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("endless-select")} variant="secondary">
                ENDLESS SIEGE
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("towers")} variant="secondary">
                TOWERS
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("collection")} variant="secondary">
                COLLECTION
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("events")} variant="secondary">
                EVENTS
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("missions")} variant="secondary">
                MISSIONS
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("achievements")} variant="secondary">
                ACHIEVEMENTS
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("shop")} variant="secondary">
                SHOP
              </ScreenButton>
              <ScreenButton onClick={() => openSettings("main-menu")} variant="secondary">
                SETTINGS
              </ScreenButton>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="rounded-lg bg-black/20 px-2 py-1.5">
                  <p className="font-display text-sm text-panel-foreground">Lv {player.level}</p>
                  <p className="text-[8px] uppercase tracking-wider text-panel-muted">Player</p>
                </div>
                <div className="rounded-lg bg-black/20 px-2 py-1.5">
                  <p className="font-display text-sm text-panel-foreground">{player.highestWave}</p>
                  <p className="text-[8px] uppercase tracking-wider text-panel-muted">Best Wave</p>
                </div>
                <div className="rounded-lg bg-black/20 px-2 py-1.5">
                  <p className="font-display text-sm text-panel-foreground">
                    {player.dailyChallengeDate === todayKey ? player.dailyChallengeBestScore : 0}
                  </p>
                  <p className="text-[8px] uppercase tracking-wider text-panel-muted">Today</p>
                </div>
              </div>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "endless-select" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/65 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel">
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">Long-tail mode</p>
              <h2 className="font-display text-2xl tracking-wide">Endless Siege</h2>
              <p className="mt-1 text-xs text-panel-muted">
                Survive as many waves as possible. Every 10 waves brings a boss.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {[
                ENDLESS_CHALLENGES.find((entry) => entry.id === "free-siege")!,
                dailyChallenge,
                weeklyChallenge,
              ].map((challenge) => {
                const isDaily = challenge.period === "daily";
                const isWeekly = challenge.period === "weekly";
                const best = isDaily
                  ? player.dailyChallengeDate === todayKey
                    ? player.dailyChallengeBestScore
                    : 0
                  : isWeekly
                    ? player.weeklyChallengeKey === weekKey
                      ? player.weeklyChallengeBestScore
                      : 0
                    : player.endlessBestScore;
                return (
                  <div key={challenge.id} className="rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-accent">
                          {isDaily ? "Today" : isWeekly ? "This week" : "Unlimited"}
                        </p>
                        <h3 className="font-display text-xl tracking-wide">{challenge.name}</h3>
                        <p className="mt-1 text-xs text-panel-muted">{challenge.description}</p>
                      </div>
                      <p className="rounded-full bg-black/30 px-2 py-1 text-[10px] text-panel-muted">
                        Best {best.toLocaleString()}
                      </p>
                    </div>
                    <ScreenButton
                      onClick={() => {
                        resetGameplayState();
                        setActiveChallenge(challenge);
                        game.startEndless(
                          challenge,
                          isDaily ? todayKey : isWeekly ? weekKey : todayKey,
                        );
                        setScreen("gameplay");
                      }}
                    >
                      PLAY
                    </ScreenButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "stage-select" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel">
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">World 1</p>
              <h2 className="font-display text-2xl tracking-wide">Suburbs</h2>
            </div>
            <div className="mt-3 space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg tracking-wide">
                        STAGE {stage.stageNumber}
                      </p>
                      <p className="text-sm">{stage.name}</p>
                      <p className="mt-1 text-xs text-panel-muted">{stage.description}</p>
                    </div>
                    <p className="rounded-full bg-black/30 px-2 py-1 text-xs uppercase tracking-wider text-panel-muted">
                      {stage.difficulty}
                    </p>
                  </div>
                  {stage.placeholder && (
                    <p className="mt-2 rounded-lg bg-black/30 px-2 py-1 text-xs text-panel-muted">
                      Placeholder stage content using current map.
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-panel-muted">
                    <p>Best wave: {stage.bestWave}</p>
                    <p>Status: {stage.completed ? "Complete" : "Not completed"}</p>
                    <p>Stars: {"★".repeat(stage.stars) || "—"}</p>
                    <p>{stage.locked ? "Locked" : "Unlocked"}</p>
                    <p>Waves: {stage.waveCount}</p>
                    <p>Reward x{stage.rewardMultiplier.toFixed(2)}</p>
                  </div>
                  <div className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-panel-muted">
                    <p>
                      Completion Reward: +{stage.rewards.completionCoins} coins · +
                      {stage.rewards.completionXp} XP
                    </p>
                    <p>
                      First Clear Bonus: +{stage.rewards.firstCompletionBonus.coins} coins · +
                      {stage.rewards.firstCompletionBonus.xp} XP · +
                      {stage.rewards.firstCompletionBonus.stars}★
                    </p>
                    <p className="mt-1">Rule: {stage.specialRules.join(" • ")}</p>
                  </div>
                  {stage.locked ? (
                    <div className="mt-2 rounded-xl bg-black/30 px-3 py-2 text-sm">
                      <p className="font-semibold">🔒 LOCKED</p>
                      <p className="text-panel-muted">{stage.requiredText}</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <ScreenButton onClick={() => startStage(stage.id)}>PLAY</ScreenButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "collection" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">Long-term collection</p>
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Tower Skins</h2>
              <p className="mt-1 text-xs text-panel-muted">Cosmetic rewards are earned through gameplay milestones.</p>
            </div>
            <div className="mt-3 space-y-2">
              {TOWER_COSMETICS.map((cosmetic) => {
                const unlocked = cosmetic.unlock(player);
                const targetKind = cosmetic.towerKind ?? "all";
                const equipped = targetKind !== "all" ? profile.equippedTowerCosmetic(targetKind) === cosmetic.id : false;
                return (
                  <div key={cosmetic.id} className="rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-12 w-12 shrink-0 rounded-xl border border-white/10" style={{ background: cosmetic.accent || "rgba(233,180,76,0.96)" }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-lg tracking-wide">{cosmetic.name}</p>
                            <p className="text-xs text-panel-muted">{cosmetic.description}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-panel-muted">{targetKind === "all" ? "All" : targetKind}</span>
                        </div>
                        <p className="mt-2 text-[10px] text-panel-muted">{unlocked ? "Unlocked" : cosmetic.requirement}</p>
                        {targetKind !== "all" && (
                          <button type="button" disabled={!unlocked} onClick={() => profile.equipTowerCosmetic(targetKind, cosmetic.id)} className="mt-2 min-h-9 w-full rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40">
                            {equipped ? "Equipped" : "Equip"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "events" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>
            <div className="mt-3 rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-panel">
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">Limited event</p>
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">{seasonalEvent.name}</h2>
              <p className="mt-1 text-xs text-panel-muted">{seasonalEvent.tagline}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-panel-muted">Cycle {seasonalCycleKey} · Ends {seasonalEventEnd.toLocaleDateString()}</p>
            </div>
            <div className="mt-3 space-y-2">
              {seasonalEvent.milestones.map((milestone) => {
                const progress = seasonalEventProgressTarget(milestone.target, player.seasonalEventProgress);
                const claimed = player.seasonalEventClaims.includes(milestone.id);
                const pct = Math.min(1, progress / milestone.target);
                return (
                  <div key={milestone.id} className="rounded-2xl bg-panel/95 p-3 shadow-panel">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg tracking-wide text-panel-foreground">{milestone.title}</p>
                        <p className="text-xs text-panel-muted">{progress.toLocaleString()} / {milestone.target.toLocaleString()} event kills</p>
                      </div>
                      <p className="text-xs text-accent">{milestone.reward.label}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/35">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: pct * 100 + "%" }} />
                    </div>
                    <ScreenButton onClick={() => profile.claimSeasonalMilestone(milestone.id)} variant={claimed ? "secondary" : "primary"} disabled={claimed || progress < milestone.target}>
                      {claimed ? "CLAIMED" : progress >= milestone.target ? "CLAIM REWARD" : "KEEP DEFENDING"}
                    </ScreenButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "towers" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Towers</h2>
              <div className="mt-2 space-y-2">
                {TOWER_KINDS.map((kind) => {
                  const info = TOWER_INFO[kind];
                  return (
                    <div key={kind} className="rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-panel-foreground">{info.name}</p>
                        <p className="text-xs text-panel-muted">Unlock Lv {info.unlockLevel}</p>
                      </div>
                      <p className="mt-1 text-xs text-panel-muted">{info.blurb}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "missions" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">
                Missions
              </h2>
              <div className="mt-2 space-y-2">
                {DAILY_MISSION_DEFS.map((mission) => {
                  const progress = player.dailyMissionProgress[mission.id];
                  return (
                    <div key={mission.id} className="rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <p className="font-semibold text-panel-foreground">{mission.description}</p>
                      <p className="text-xs text-panel-muted">
                        Progress {Math.min(mission.target, progress?.progress ?? 0)}/
                        {mission.target}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "achievements" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">
                Achievements
              </h2>
              <div className="mt-2 space-y-2">
                {ACHIEVEMENT_DEFS.map((achievement) => {
                  const progress = player.achievements[achievement.id];
                  return (
                    <div key={achievement.id} className="rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <p className="font-semibold text-panel-foreground">{achievement.title}</p>
                      <p className="text-xs text-panel-muted">{achievement.description}</p>
                      <p className="text-xs text-panel-muted">
                        Progress {Math.min(achievement.target, progress?.progress ?? 0)}/
                        {achievement.target}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "shop" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/60 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-accent">Optional extras</p>
                  <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Shop</h2>
                  <p className="mt-1 text-xs text-panel-muted">
                    Progression comes from play. Purchases are optional quality-of-life, support, or cosmetics.
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-black/25 px-3 py-2 text-right">
                  <p className="text-sm text-accent">{player.coins.toLocaleString()} COINS</p>
                  <p className="text-xs text-panel-muted">{player.gems.toLocaleString()} GEMS</p>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {STORE_CATALOG.map((item) => {
                const owned =
                  purchasedProducts[item.product] === true ||
                  (item.product === "remove-ads" && player.adsRemoved);
                const available = isPurchaseAvailable(item.product);
                const status = storeItemStatus(available, owned);

                return (
                  <div
                    key={item.product}
                    className="rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-panel"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg tracking-wide text-panel-foreground">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-panel-muted">{item.description}</p>
                      </div>
                      <span
                        className={
                          "shrink-0 rounded-lg px-2 py-1 text-[9px] font-semibold tracking-wider " +
                          (owned
                            ? "bg-accent/15 text-accent"
                            : available
                              ? "bg-accent text-accent-foreground"
                              : "bg-black/25 text-panel-muted")
                        }
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-3">
                      {owned ? (
                        <div className="rounded-xl bg-black/20 px-3 py-2 text-center text-[10px] uppercase tracking-wider text-accent">
                          Already owned
                        </div>
                      ) : available ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await purchase(item.product);
                            if (!success) return;
                            setPurchasedProducts((current) => ({
                              ...current,
                              [item.product]: true,
                            }));
                            if (item.product === "remove-ads") profile.setAdsRemoved(true);
                            track("iap_purchase", { product: item.product });
                          }}
                          className="min-h-10 w-full rounded-xl bg-accent px-3 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98]"
                        >
                          PURCHASE
                        </button>
                      ) : (
                        <div className="rounded-xl bg-black/20 px-3 py-2 text-center text-[10px] leading-tight text-panel-muted">
                          Purchase activates in the native mobile store build.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "settings" && (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-3">
          <ScreenCard>
            <h2 className="text-center font-display text-2xl tracking-wide text-panel-foreground">
              Settings
            </h2>
            <div className="mt-3 space-y-2">
              <ScreenButton
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setMutedState(next);
                }}
                variant="secondary"
              >
                {muted ? "Sound: Off" : "Sound: On"}
              </ScreenButton>
              <ScreenButton
                onClick={() => profile.setReducedMotion(!player.reducedMotion)}
                variant="secondary"
              >
                Reduced Motion: {player.reducedMotion ? "On" : "Off"}
              </ScreenButton>
              <ScreenButton onClick={closeSettings} variant="secondary">
                ← BACK
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "results" && (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-3">
          <ScreenCard>
            <h2
              className={
                "text-center font-display text-3xl tracking-wide " +
                (state.stageWon ? "text-accent" : state.endlessMode ? "text-accent" : "text-danger")
              }
            >
              {resultLabel}
            </h2>
            {state.endlessMode && activeChallenge && (
              <p className="mt-1 text-center text-sm text-panel-muted">{activeChallenge.name}</p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <div className="rounded-xl bg-black/30 px-2 py-2 text-center">
                <p className="font-display text-lg text-panel-foreground">{state.kills}</p>
                <p className="text-[8px] uppercase tracking-wider text-panel-muted">Kills</p>
              </div>
              <div className="rounded-xl bg-black/30 px-2 py-2 text-center">
                <p className="font-display text-lg text-panel-foreground">{state.maxKillStreak}</p>
                <p className="text-[8px] uppercase tracking-wider text-panel-muted">Best Streak</p>
              </div>
              <div className="rounded-xl bg-black/30 px-2 py-2 text-center">
                <p className="font-display text-lg text-panel-foreground">{state.uniqueTowerKinds.length}</p>
                <p className="text-[8px] uppercase tracking-wider text-panel-muted">Tower Types</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-3 text-sm text-panel-foreground">
              <p>Wave Reached</p>
              <p className="text-right">{state.wave}</p>
              {state.endlessMode && (
                <>
                  <p>Score</p>
                  <p className="text-right">{(lastReward && "score" in lastReward ? lastReward.score : 0).toLocaleString()}</p>
                  <p>Best Challenge Score</p>
                  <p className="text-right">{endlessBestDisplay.toLocaleString()}</p>
                </>
              )}

              <p>Coins Earned</p>
              <p className="text-right">{lastReward?.coins ?? 0}</p>
              <p>XP Earned</p>
              <p className="text-right">{lastReward?.xp ?? 0}</p>
              <p>Stars Earned</p>
              <p className="text-right">{"★".repeat(lastReward?.starsEarned ?? 0) || "—"}</p>
              <p>Best Wave</p>
              <p className="text-right">
                {lastReward?.previousBestWave ?? 0} →{" "}
                {Math.max(lastReward?.previousBestWave ?? 0, state.wave)}
              </p>
              <p>Best Stars</p>
              <p className="text-right">
                {"★".repeat(lastReward?.previousBestStars ?? 0) || "—"} →{" "}
                {"★".repeat(lastReward?.bestStars ?? 0) || "—"}
              </p>
            </div>
            {lastReward?.newRecord && (
              <p className="mt-3 text-center font-display text-xl tracking-wide text-accent">
                NEW RECORD!
              </p>
            )}
            {!state.stageWon &&
              !state.reviveUsed &&
              state.baseHp <= 0 &&
              rewardedAvailable && (
                <ScreenButton
                  onClick={async () => {
                    const { showRewarded } = await import("@/game/monetization");
                    const earned = await showRewarded("revive");
                    if (earned && game.reviveRun()) setScreen("gameplay");
                  }}
                  variant="secondary"
                >
                  SECOND CHANCE · WATCH AD
                </ScreenButton>
              )}
            {lastReward &&
              !player.adsRemoved &&
              rewardedAvailable &&
              profile.canClaimLastRunRewardBoost && (
                <ScreenButton
                  onClick={async () => {
                    const { showRewarded } = await import("@/game/monetization");
                    const earned = await showRewarded("double-run-rewards");
                    if (earned) profile.claimLastRunRewardBoost();
                  }}
                  variant="secondary"
                >
                  DOUBLE REWARDS · WATCH AD
                </ScreenButton>
              )}
            {lastReward?.stageCompleted && (
              <div className="mt-3 space-y-1 rounded-2xl bg-black/30 p-3 text-sm text-panel-foreground">
                {evaluateStageObjectives(activeStage.objectives, {
                  stageCompleted: true,
                  baseHealth: state.baseHp,
                  baseMaxHealth: state.baseMaxHp,
                  towersPlaced: state.towersPlaced,
                  maxKillStreak: state.maxKillStreak,
                  uniqueTowerKinds: state.uniqueTowerKinds.length,
                }).results.map((result, index) => (
                  <p key={result.objective.id}>
                    {index + 1 === 1 ? "⭐" : index + 1 === 2 ? "⭐⭐" : "⭐⭐⭐"}{" "}
                    {result.passed ? "✓" : "✕"} {result.objective.label}
                  </p>
                ))}
                <p className="pt-1 text-xs text-panel-muted">
                  {lastReward.firstCompletionBonusApplied
                    ? "First-clear bonus awarded."
                    : "Replay rewards awarded (first-clear bonus already claimed)."}
                </p>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {state.stageWon && nextStage ? (
                <ScreenButton onClick={() => startStage(nextStage.id)}>
                  NEXT STAGE · {nextStage.name}
                </ScreenButton>
              ) : state.stageWon ? (
                <ScreenButton onClick={leaveToStageSelect}>CAMPAIGN</ScreenButton>
              ) : state.endlessMode && activeChallenge ? (
                <ScreenButton
                  onClick={() => {
                    resetGameplayState();
                    game.startEndless(
                      activeChallenge,
                      activeChallenge.period === "weekly" ? weekKey : todayKey,
                    );
                    setScreen("gameplay");
                  }}
                >
                  RETRY
                </ScreenButton>
              ) : (
                <ScreenButton onClick={() => startStage(activeStageId)}>RETRY</ScreenButton>
              )}
              {state.stageWon && (
                <ScreenButton onClick={() => startStage(activeStageId)} variant="secondary">
                  REPLAY STAGE
                </ScreenButton>
              )}
              <ScreenButton onClick={leaveToStageSelect} variant="secondary">
                STAGE SELECT
              </ScreenButton>
              <ScreenButton onClick={leaveToMainMenu} variant="secondary">
                MAIN MENU
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "gameplay" && overlay === "pause" && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-3">
          <ScreenCard>
            <h2 className="text-center font-display text-3xl tracking-wide text-panel-foreground">
              PAUSED
            </h2>
            <div className="mt-4 space-y-2">
              <ScreenButton onClick={() => setOverlay(null)}>RESUME</ScreenButton>
              <ScreenButton onClick={() => setOverlay("confirm-restart")} variant="secondary">
                RESTART
              </ScreenButton>
              <ScreenButton onClick={leaveToStageSelect} variant="secondary">
                STAGE SELECT
              </ScreenButton>
              <ScreenButton onClick={() => openSettings("gameplay")} variant="secondary">
                SETTINGS
              </ScreenButton>
              <ScreenButton onClick={() => setOverlay(null)} variant="secondary">
                ✕ CLOSE
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "gameplay" && overlay === "confirm-restart" && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
          <ScreenCard>
            <h3 className="text-center font-display text-2xl tracking-wide text-panel-foreground">
              Restart Stage {activeStageId}?
            </h3>
            <p className="mt-2 text-center text-sm text-panel-muted">
              Current run progress will be lost.
            </p>
            <div className="mt-4 space-y-2">
              <ScreenButton onClick={() => startStage(activeStageId)}>YES, RESTART</ScreenButton>
              <ScreenButton onClick={() => setOverlay("pause")} variant="secondary">
                ← BACK
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}
    </div>
  );
}
