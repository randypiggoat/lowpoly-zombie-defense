import { Canvas } from "@react-three/fiber";
import { type ReactNode, useCallback, useEffect, useState, useSyncExternalStore } from "react";
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
import { ACHIEVEMENT_DEFS, DAILY_MISSION_DEFS, profile } from "@/game/profile";

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

export function GameCanvas() {
  const state = useGameSnapshot();
  const { player, lastReward } = useProfileSnapshot();
  const [selection, setSelection] = useState<Selection>(null);
  const [screen, setScreen] = useState<PrimaryScreen>("main-menu");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settingsBackScreen, setSettingsBackScreen] = useState<PrimaryScreen>("main-menu");
  const [activeStageId, setActiveStageId] = useState(1);
  const [muted, setMutedState] = useState(isMuted());
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
    if (screen === "gameplay" && state.gameOver) {
      setOverlay(null);
      setSelection(null);
      setScreen("results");
    }
  }, [screen, state.gameOver]);

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
  const resultLabel = state.stageWon ? "STAGE COMPLETE" : "GAME OVER";

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky" onPointerDown={() => unlockAudio()}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2, 26, 30], fov: 40 }}
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

      {screen === "gameplay" && (
        <>
          <HUD
            state={state}
            selection={selection}
            onSelect={setSelection}
            showMetaSections={false}
            showGameOverOverlay={false}
          />
          <div className="pointer-events-none absolute left-0 right-0 top-3 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="ml-auto flex w-full max-w-xs items-center justify-end gap-2">
              <div className="rounded-xl bg-panel/85 px-3 py-2 text-xs font-semibold text-panel-foreground shadow-panel">
                STAGE {activeStage.stageNumber} · WAVE {Math.min(state.wave, state.stageWaveTarget)}
                /{state.stageWaveTarget}
              </div>
              <button
                onClick={() => setOverlay("pause")}
                className="pointer-events-auto rounded-xl bg-panel/90 px-4 py-2 text-sm font-semibold text-panel-foreground shadow-panel"
              >
                MENU
              </button>
            </div>
          </div>
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
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Shop</h2>
              <p className="mt-1 text-sm text-panel-muted">
                Use earned currency for progression upgrades.
              </p>
              <div className="mt-3 rounded-xl bg-black/25 p-3">
                <p className="text-sm text-panel-foreground">Coins: {player.coins}</p>
                <p className="text-sm text-panel-foreground">Gems: {player.gems}</p>
              </div>
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
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-3 text-sm text-panel-foreground">
              <p>Wave Reached</p>
              <p className="text-right">{state.wave}</p>
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
              </div>
            )}
            <div className="mt-4 space-y-2">
              {state.stageWon ? (
                <ScreenButton onClick={leaveToStageSelect}>CONTINUE</ScreenButton>
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
