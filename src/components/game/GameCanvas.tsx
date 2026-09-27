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
  getStageById,
  stageUnlockRequirementText,
  type PrimaryScreen,
} from "@/game/navigation";
import { ACHIEVEMENT_DEFS, DAILY_MISSION_DEFS, dateKey, profile } from "@/game/profile";
import {
  ENDLESS_CHALLENGES,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeekKey,
  type EndlessChallenge,
} from "@/game/endless";

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

const STORE_PRODUCTS: Array<{
  id: PurchaseProduct;
  name: string;
  description: string;
  price: string;
}> = [
  {
    id: "remove-ads",
    name: "Remove Ads",
    description: "Removes transition ads while keeping optional rewarded ads.",
    price: "Store price",
  },
  {
    id: "supporter-pack",
    name: "Supporter Pack",
    description: "A cosmetic support bundle for players who want to back Rotwood.",
    price: "Store price",
  },
  {
    id: "cosmetic-pack",
    name: "Cosmetic Pack",
    description: "A themed tower skin bundle. Cosmetic only.",
    price: "Store price",
  },
];

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
  const [storeProviderAvailable, setStoreProviderAvailable] = useState(false);
  const activeStage = getStageById(activeStageId);

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
        setStoreProviderAvailable(isPurchaseAvailable("remove-ads"));
      })
      .catch(() => {
        setRewardedAvailable(false);
      setStoreProviderAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (screen === "gameplay" && state.gameOver && !state.defeatOffer) {
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

  const todayKey = dateKey();
  const weekKey = getWeekKey();
  const dailyChallenge = getDailyChallenge(todayKey);
  const weeklyChallenge = getWeeklyChallenge(weekKey);

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
            paused={paused}
            towers={state.towers}
            selection={selection}
            onSelectTower={(id) => setSelection({ kind: "tower", id })}
            onSelectSpot={(index) => setSelection({ kind: "spot", index })}
          />
        </Canvas>
      )}

      {screen === "gameplay" && state.defeatOffer && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <ScreenCard>
            <p className="text-center text-xs uppercase tracking-[0.22em] text-danger">Base breached</p>
            <h2 className="mt-1 text-center font-display text-3xl tracking-wide text-panel-foreground">LAST STAND</h2>
            <p className="mt-2 text-center text-sm text-panel-muted">
              You have {Math.ceil(state.defeatOfferTime)} seconds to decide.
            </p>
            <div className="mt-4 space-y-2">
              {!player.adsRemoved && rewardedAvailable && state.revivesUsed < 1 && (
                <ScreenButton
                  onClick={async () => {
                    const { showRewarded } = await import("@/game/monetization");
                    const earned = await showRewarded("revive");
                    if (earned) game.reviveRun();
                  }}
                >
                  REVIVE · WATCH AD
                </ScreenButton>
              )}
              <ScreenButton
                onClick={() => game.finalizeDefeat()}
                variant="secondary"
              >
                END RUN
              </ScreenButton>
            </div>
            <p className="mt-3 text-center text-[10px] text-panel-muted">
              One revive per run. Watching an ad is optional.
            </p>
          </ScreenCard>
        </div>
      )}

      {screen === "gameplay" && (
        <>
          <HUD
            state={state}
            selection={selection}
            onSelect={setSelection}
            onPause={() => setOverlay("pause")}
            showMetaSections={false}
            showGameOverOverlay={false}
            rewardedAvailable={rewardedAvailable}
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
              <ScreenButton onClick={() => setScreen("stage-select")}>PLAY</ScreenButton>
              <ScreenButton onClick={() => setScreen("endless-select")} variant="secondary">
                ENDLESS SIEGE
              </ScreenButton>
              <ScreenButton onClick={() => setScreen("towers")} variant="secondary">
                TOWERS
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
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">Optional support</p>
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Rotwood Shop</h2>
              <p className="mt-1 text-xs text-panel-muted">
                Core gameplay stays playable without spending. Mobile store pricing appears when native billing is connected.
              </p>
              <div className="mt-3 rounded-xl bg-black/25 p-3">
                <p className="text-sm text-panel-foreground">Coins: {player.coins}</p>
                <p className="text-sm text-panel-foreground">Gems: {player.gems}</p>
                <p className="mt-1 text-[10px] text-panel-muted">
                  Ads: {player.adsRemoved ? "Removed" : "Enabled"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {STORE_PRODUCTS.map((product) => {
                const available = storeProviderAvailable;
                return (
                  <div key={product.id} className="rounded-2xl bg-panel/95 p-3 shadow-panel">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg tracking-wide text-panel-foreground">{product.name}</p>
                        <p className="mt-1 text-xs text-panel-muted">{product.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-accent">{product.price}</span>
                    </div>
                    <ScreenButton
                      onClick={async () => {
                        const { purchase } = await import("@/game/monetization");
                        const purchased = await purchase(product.id);
                        if (purchased && product.id === "remove-ads") {
                          profile.setAdsRemoved(true);
                        }
                      }}
                      variant="secondary"
                      disabled={!available}
                    >
                      {available && storeProviderAvailable ? "PURCHASE" : "MOBILE STORE REQUIRED"}
                    </ScreenButton>
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
            <h2 className="text-center font-display text-3xl tracking-wide text-danger">
              {resultLabel}
            </h2>
            {state.endlessMode && activeChallenge && (
              <p className="mt-1 text-center text-sm text-panel-muted">{activeChallenge.name}</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-3 text-sm text-panel-foreground">
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
              <p>Zombies Killed</p>
              <p className="text-right">{state.kills}</p>
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
              {state.stageWon ? (
                <ScreenButton onClick={leaveToStageSelect}>CONTINUE</ScreenButton>
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
                  REPLAY
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
