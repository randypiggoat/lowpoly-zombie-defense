import { Canvas } from "@react-three/fiber";
import {
  ArrowLeft,
  ChevronRight,
  Coins,
  Crosshair,
  Gem,
  Gift,
  Lock,
  Pause,
  RotateCcw,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import {
  Suspense,
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
import {
  ACHIEVEMENT_DEFS,
  DAILY_LOGIN_REWARDS,
  DAILY_MISSION_DEFS,
  profile,
  xpForLevel,
} from "@/game/profile";
import {
  canPurchaseInCurrentBuild,
  getFeaturedProducts,
  getRotationProducts,
} from "@/game/storefront";

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
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
};

function ScreenButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  icon,
  className = "",
}: ScreenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rotwood-button rotwood-button-${variant} inline-flex w-full items-center justify-center gap-2 ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function ScreenCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rotwood-shell rotwood-pop w-full max-w-md p-4 ${className}`}>{children}</div>;
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="rotwood-kicker">{children}</p>;
}

function CurrencyChip({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rotwood-currency">
      <span className="shrink-0">{icon}</span>
      <span className="rotwood-currency-value tabular-nums">{value}</span>
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-panel-muted sm:inline">
        {label}
      </span>
    </div>
  );
}

function ScreenTopBar({
  title,
  kicker,
  onBack,
  right,
}: {
  title: string;
  kicker?: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="rotwood-button rotwood-button-secondary grid h-11 w-11 shrink-0 place-items-center p-0"
      >
        <ArrowLeft size={19} />
      </button>
      <div className="min-w-0 flex-1">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h2 className="rotwood-display truncate text-2xl text-panel-foreground">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rotwood-nav flex flex-1 flex-col items-center justify-center gap-1"
      data-active={active}
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] font-extrabold uppercase tracking-[0.13em]">{label}</span>
    </button>
  );
}

function ProgressMeter({ value, max }: { value: number; max: number }) {
  const percent = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/35">
      <div
        className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(233,180,76,0.22)] transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent" aria-label={`${count} stars`}>
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= count ? "currentColor" : "transparent"}
          strokeWidth={star <= count ? 2.4 : 1.8}
          className={star <= count ? "" : "opacity-30"}
        />
      ))}
    </span>
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
  const [canvasReady, setCanvasReady] = useState(false);
  const activeStage = getStageById(activeStageId);

  const stages = STAGE_DEFS.map((stage) => {
    const progress = player.stageProgress[String(stage.id)];
    const isUnlocked = progress?.unlocked ?? stage.id === 1;
    return {
      ...stage,
      locked: !isUnlocked,
      requiredText: stageUnlockRequirementText(stage.unlockRequirement),
      bestWave: progress?.bestWave ?? 0,
      completed: progress?.completed ?? false,
      stars: progress?.stars ?? 0,
    };
  });

  const recommendedStage =
    stages.find((stage) => !stage.locked && !stage.completed) ??
    stages.find((stage) => !stage.locked) ??
    stages[0]!;
  const todayReward = DAILY_LOGIN_REWARDS.find((reward) => reward.day === player.loginCycleDay);
  const claimedLoginToday = player.lastLoginClaimDate === dateKey();
  const xpTarget = xpForLevel(player.level);
  const xpPercent = Math.min(100, (player.xp / Math.max(1, xpTarget)) * 100);
  const readyMissionCount = DAILY_MISSION_DEFS.filter((mission) => {
    const progress = player.dailyMissionProgress[mission.id];
    return Boolean(progress?.completed && !progress.claimed);
  }).length;
  const readyAchievementCount = ACHIEVEMENT_DEFS.filter((achievement) => {
    const progress = player.achievements[achievement.id];
    return Boolean(progress?.completed && !progress.claimed);
  }).length;
  const featuredProducts = getFeaturedProducts();
  const rotationProducts = getRotationProducts();

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
  }, []);

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
      if (screen === "gameplay" && !state.gameOver) setOverlay("pause");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSettings, overlay, screen, state.gameOver]);

  const paused = screen !== "gameplay" || overlay !== null;
  const resultLabel = state.stageWon ? "STAGE COMPLETE" : "GAME OVER";

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
          onCreated={({ gl }) => gl.setClearColor("#8fc4d8")}
          onPointerMissed={() => setSelection(null)}
        >
          <Suspense fallback={null}>
            <Scene
              paused={paused}
              towers={state.towers}
              selection={selection}
              onSelectTower={(id) => setSelection({ kind: "tower", id })}
              onSelectSpot={(index) => setSelection({ kind: "spot", index })}
            />
          </Suspense>
        </Canvas>
      )}

      {screen === "gameplay" && (
        <HUD
          state={state}
          selection={selection}
          onSelect={setSelection}
          onPause={() => setOverlay("pause")}
          showMetaSections={false}
          showGameOverOverlay={false}
        />
      )}

      {screen === "main-menu" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 flex items-end justify-center overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="w-full max-w-md pb-16 sm:pb-2">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div>
                <Kicker>Last defense network</Kicker>
                <h1 className="rotwood-display text-3xl text-panel-foreground">Rotwood Defense</h1>
              </div>
              <button
                type="button"
                onClick={() => openSettings("main-menu")}
                aria-label="Settings"
                className="rotwood-button rotwood-button-secondary grid h-11 w-11 shrink-0 place-items-center p-0"
              >
                <Settings2 size={19} />
              </button>
            </div>

            <div className="rotwood-card rotwood-shine mb-2 p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-inner">
                  <ShieldMark />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="rotwood-display text-lg text-panel-foreground">LV {player.level}</p>
                    <span className="text-[11px] font-bold text-panel-muted">{Math.round(xpPercent)}% XP</span>
                  </div>
                  <ProgressMeter value={player.xp} max={xpTarget} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <CurrencyChip icon={<Coins size={15} />} value={player.coins} label="Coins" />
                <CurrencyChip icon={<Gem size={15} />} value={player.gems} label="Gems" />
              </div>
            </div>

            <div className="rotwood-card rotwood-card-highlight p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Kicker>Next defense</Kicker>
                  <h2 className="rotwood-display mt-1 text-2xl text-panel-foreground">
                    STAGE {recommendedStage.stageNumber} · {recommendedStage.name}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-panel-muted">
                    {recommendedStage.description}
                  </p>
                </div>
                <div className="rounded-lg border border-accent/25 bg-accent/10 px-2 py-1">
                  <span className="rotwood-display text-sm text-accent">{recommendedStage.difficulty}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniMetric label="Waves" value={recommendedStage.waveCount} />
                <MiniMetric label="Best" value={recommendedStage.bestWave || "—"} />
                <MiniMetric label="Stars" value={<Stars count={recommendedStage.stars} size={13} />} />
              </div>
              <ScreenButton
                className="mt-3"
                onClick={() => startStage(recommendedStage.id)}
                icon={<Swords size={18} />}
              >
                DEFEND NOW
              </ScreenButton>
            </div>

            {todayReward && (
              <div className="rotwood-card mt-2 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Gift size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Kicker>Daily supply drop</Kicker>
                    <p className="rotwood-display text-lg text-panel-foreground">
                      DAY {player.loginCycleDay}/7 · {todayReward.title}
                    </p>
                    <p className="text-xs text-panel-muted">{todayReward.reward.label}</p>
                  </div>
                  <ScreenButton
                    className="w-auto shrink-0 px-3 text-xs"
                    onClick={() => profile.claimDailyLoginReward()}
                    disabled={claimedLoginToday}
                  >
                    {claimedLoginToday ? "CLAIMED" : "CLAIM"}
                  </ScreenButton>
                </div>
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <ShortcutTile
                title="Towers"
                subtitle="Armory & mastery"
                icon={<Wrench size={18} />}
                badge={undefined}
                onClick={() => setScreen("towers")}
              />
              <ShortcutTile
                title="Missions"
                subtitle="Daily objectives"
                icon={<Gift size={18} />}
                badge={readyMissionCount || undefined}
                onClick={() => setScreen("missions")}
              />
              <ShortcutTile
                title="Achievements"
                subtitle="Long-term milestones"
                icon={<Trophy size={18} />}
                badge={readyAchievementCount || undefined}
                onClick={() => setScreen("achievements")}
              />
              <ShortcutTile
                title="Market"
                subtitle="Cosmetics & support"
                icon={<ShoppingBag size={18} />}
                badge={undefined}
                onClick={() => setScreen("shop")}
              />
            </div>

            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
              <p className="text-[11px] text-panel-muted">
                Your progress is earned through play. Optional cosmetics and convenience can sit
                around the core game without blocking it.
              </p>
            </div>

            <div className="fixed bottom-2 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-1.5 rounded-2xl border border-white/10 bg-panel/95 p-1.5 shadow-panel backdrop-blur">
              <NavButton active label="Home" icon={<ShieldMark size={17} />} onClick={() => setScreen("main-menu")} />
              <NavButton label="Play" icon={<Swords size={17} />} onClick={() => setScreen("stage-select")} />
              <NavButton label="Towers" icon={<Wrench size={17} />} onClick={() => setScreen("towers")} />
              <NavButton label="Market" icon={<ShoppingBag size={17} />} onClick={() => setScreen("shop")} />
            </div>
          </div>
        </div>
      )}

      {screen === "stage-select" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenTopBar title="Defense Route" kicker="World 01 · Suburbs" onBack={() => setScreen("main-menu")} />
            <div className="rotwood-card rotwood-card-highlight mb-3 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Kicker>Campaign progress</Kicker>
                  <p className="rotwood-display mt-1 text-xl text-panel-foreground">
                    {stages.filter((stage) => stage.completed).length}/{stages.length} cleared
                  </p>
                </div>
                <Stars count={Math.max(...stages.map((stage) => stage.stars), 0)} size={17} />
              </div>
              <p className="mt-2 text-xs text-panel-muted">
                Follow the route, master each location, then replay for cleaner clears and harder challenges.
              </p>
            </div>

            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div key={stage.id} className="relative pl-12">
                  {index < stages.length - 1 && <div className="rotwood-stage-line" />}
                  <div
                    className="rotwood-stage-node absolute left-0 top-0"
                    data-state={stage.locked ? "locked" : stage.completed ? "complete" : "active"}
                  >
                    {stage.locked ? <Lock size={15} /> : stage.completed ? <Star size={16} fill="currentColor" /> : <span className="rotwood-display text-sm">{stage.stageNumber}</span>}
                  </div>
                  <div className={`rotwood-card ${stage.completed ? "rotwood-card-highlight" : ""} p-3`}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Kicker>Stage {stage.stageNumber}</Kicker>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-panel-muted">
                            {stage.difficulty}
                          </span>
                        </div>
                        <h3 className="rotwood-display mt-1 text-xl text-panel-foreground">{stage.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-panel-muted">{stage.description}</p>
                      </div>
                      <Stars count={stage.stars} size={14} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniMetric label="Waves" value={stage.waveCount} />
                      <MiniMetric label="Best" value={stage.bestWave || "—"} />
                      <MiniMetric label="Reward" value={`x${stage.rewardMultiplier.toFixed(2)}`} />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="min-w-0 flex-1 rounded-lg bg-black/20 px-2.5 py-2 text-[11px] text-panel-muted">
                        <span className="font-semibold text-panel-foreground">
                          +{stage.rewards.completionCoins} coins
                        </span>{" "}
                        · +{stage.rewards.completionXp} XP
                      </div>
                      {stage.locked ? (
                        <div className="rounded-lg bg-black/25 px-3 py-2 text-xs text-panel-muted">
                          {stage.requiredText}
                        </div>
                      ) : (
                        <ScreenButton
                          className="w-auto shrink-0 px-4 text-xs"
                          onClick={() => startStage(stage.id)}
                          icon={<ChevronRight size={17} />}
                        >
                          PLAY
                        </ScreenButton>
                      )}
                    </div>
                    {stage.specialRules.length > 0 && (
                      <p className="mt-2 text-[11px] text-panel-muted">
                        <span className="font-bold text-panel-foreground">Rule:</span>{" "}
                        {stage.specialRules.join(" • ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "towers" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenTopBar title="Armory" kicker="Tower collection" onBack={() => setScreen("main-menu")} />
            <div className="rotwood-card mb-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Kicker>Loadout</Kicker>
                  <p className="rotwood-display mt-1 text-xl text-panel-foreground">
                    {TOWER_KINDS.length} towers in blueprint
                  </p>
                </div>
                <Crosshair className="text-accent" size={22} />
              </div>
              <p className="mt-2 text-xs text-panel-muted">
                Each tower should read instantly: silhouette, role, cost, and upgrade identity before the player ever opens its details.
              </p>
            </div>
            <div className="space-y-2">
              {TOWER_KINDS.map((kind) => {
                const info = TOWER_INFO[kind];
                const unlocked = (player.unlockedTowers as string[]).includes(kind) || player.level >= info.unlockLevel;
                const masteryLevel = player.towerUpgrades[kind]?.level ?? 0;
                return (
                  <div key={kind} className={`rotwood-card ${unlocked ? "" : "opacity-65"} p-3`}>
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border"
                        style={{
                          borderColor: `${info.accent}66`,
                          backgroundColor: `${info.accent}1b`,
                          color: info.accent,
                        }}
                      >
                        <span className="rotwood-display text-xl">{info.name.slice(0, 1)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="rotwood-display text-lg text-panel-foreground">{info.name}</p>
                          {unlocked ? (
                            <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                              Ready
                            </span>
                          ) : (
                            <Lock size={15} className="text-panel-muted" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-panel-muted">{info.blurb}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniMetric label="Cost" value={`${info.cost}g`} />
                      <MiniMetric label="Unlock" value={`Lv ${info.unlockLevel}`} />
                      <MiniMetric label="Mastery" value={masteryLevel} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "missions" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenTopBar title="Missions" kicker="Daily command board" onBack={() => setScreen("main-menu")} />
            <div className="rotwood-card rotwood-card-highlight mb-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Kicker>Today</Kicker>
                  <p className="rotwood-display mt-1 text-xl text-panel-foreground">
                    {readyMissionCount} rewards ready
                  </p>
                </div>
                <Gift className="text-accent" size={22} />
              </div>
            </div>
            <div className="space-y-2">
              {DAILY_MISSION_DEFS.map((mission) => {
                const progress = player.dailyMissionProgress[mission.id];
                const current = Math.min(mission.target, progress?.progress ?? 0);
                const complete = Boolean(progress?.completed);
                return (
                  <div key={mission.id} className={`rotwood-card ${complete && !progress?.claimed ? "rotwood-card-highlight" : ""} p-3`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/25 text-accent">
                        <Crosshair size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="rotwood-display text-lg text-panel-foreground">{mission.description}</p>
                        <p className="mt-0.5 text-xs text-panel-muted">Reward · {mission.reward.label}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-[11px] text-panel-muted">
                            <span>Progress</span>
                            <span className="font-bold tabular-nums text-panel-foreground">
                              {current}/{mission.target}
                            </span>
                          </div>
                          <ProgressMeter value={current} max={mission.target} />
                        </div>
                      </div>
                    </div>
                    {complete && !progress?.claimed && (
                      <ScreenButton
                        className="mt-2 w-full text-xs"
                        onClick={() => profile.claimDailyMission(mission.id)}
                        icon={<Gift size={15} />}
                      >
                        CLAIM REWARD
                      </ScreenButton>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "achievements" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenTopBar title="Records" kicker="Achievements" onBack={() => setScreen("main-menu")} />
            <div className="rotwood-card rotwood-card-highlight mb-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Kicker>Long-term record</Kicker>
                  <p className="rotwood-display mt-1 text-xl text-panel-foreground">
                    {readyAchievementCount} rewards ready
                  </p>
                </div>
                <Trophy className="text-accent" size={22} />
              </div>
            </div>
            <div className="space-y-2">
              {ACHIEVEMENT_DEFS.map((achievement) => {
                const progress = player.achievements[achievement.id];
                const current = Math.min(achievement.target, progress?.progress ?? 0);
                const complete = Boolean(progress?.completed);
                return (
                  <div key={achievement.id} className={`rotwood-card ${complete && !progress?.claimed ? "rotwood-card-highlight" : ""} p-3`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/25 text-accent">
                        <Trophy size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="rotwood-display text-lg text-panel-foreground">{achievement.title}</p>
                        <p className="mt-0.5 text-xs text-panel-muted">{achievement.description}</p>
                        <p className="mt-1 text-xs text-panel-foreground">Reward · {achievement.reward.label}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-[11px] text-panel-muted">
                            <span>Progress</span>
                            <span className="font-bold tabular-nums text-panel-foreground">
                              {current}/{achievement.target}
                            </span>
                          </div>
                          <ProgressMeter value={current} max={achievement.target} />
                        </div>
                      </div>
                    </div>
                    {complete && !progress?.claimed && (
                      <ScreenButton
                        className="mt-2 w-full text-xs"
                        onClick={() => profile.claimAchievement(achievement.id)}
                        icon={<Trophy size={15} />}
                      >
                        CLAIM REWARD
                      </ScreenButton>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {screen === "shop" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenTopBar
              title="Market"
              kicker="Cosmetics & support"
              onBack={() => setScreen("main-menu")}
              right={
                <div className="flex items-center gap-1.5">
                  <CurrencyChip icon={<Coins size={14} />} value={player.coins} label="Coins" />
                  <CurrencyChip icon={<Gem size={14} />} value={player.gems} label="Gems" />
                </div>
              }
            />

            <div className="rotwood-card rotwood-card-highlight rotwood-shine mb-3 p-3">
              <Kicker>Featured</Kicker>
              {featuredProducts[0] && (
                <>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                      <Sparkles size={25} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="rotwood-display text-2xl text-panel-foreground">{featuredProducts[0].name}</p>
                      <p className="text-xs text-panel-muted">{featuredProducts[0].tagline}</p>
                    </div>
                    <span className="rotwood-display text-lg text-accent">{featuredProducts[0].priceLabel}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {featuredProducts[0].includes.map((item) => (
                      <span key={item} className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-panel-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-panel-muted">
                    {canPurchaseInCurrentBuild()
                      ? "Available to purchase."
                      : "Preview mode: real App Store / Play Billing will be connected in the native build."}
                  </div>
                </>
              )}
            </div>

            <Kicker>Weekly rotation</Kicker>
            <div className="mt-2 space-y-2">
              {rotationProducts.map((product) => (
                <div key={product.id} className="rotwood-card p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border"
                      style={{ borderColor: `${product.accent}66`, backgroundColor: `${product.accent}1b`, color: product.accent }}
                    >
                      <Sparkles size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="rotwood-display text-lg text-panel-foreground">{product.name}</p>
                      <p className="text-xs text-panel-muted">{product.tagline}</p>
                    </div>
                    <span className="rotwood-display text-base text-accent">{product.priceLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rotwood-card p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-panel-foreground">
                  <ShoppingBag size={19} />
                </div>
                <div>
                  <Kicker>Store philosophy</Kicker>
                  <p className="rotwood-display text-lg text-panel-foreground">PLAY FIRST</p>
                  <p className="text-xs text-panel-muted">
                    Cosmetics and convenience should add value without placing the core defense loop behind a paywall.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "settings" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 flex items-center justify-center p-3">
          <ScreenCard>
            <div className="text-center">
              <Kicker>Field controls</Kicker>
              <h2 className="rotwood-display mt-1 text-3xl text-panel-foreground">Settings</h2>
            </div>
            <div className="mt-4 space-y-2">
              <ScreenButton
                variant="secondary"
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setMutedState(next);
                }}
                icon={muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              >
                {muted ? "SOUND OFF" : "SOUND ON"}
              </ScreenButton>
              <ScreenButton onClick={closeSettings} variant="ghost" icon={<ArrowLeft size={17} />}>
                BACK
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "results" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-3">
          <ScreenCard className="rotwood-card-highlight">
            <div className="text-center">
              <Kicker>{state.stageWon ? "Defense report" : "Line breached"}</Kicker>
              <h2 className={`rotwood-display mt-1 text-4xl ${state.stageWon ? "text-accent" : "text-danger"}`}>
                {resultLabel}
              </h2>
              {state.stageWon && lastReward?.starsEarned ? (
                <div className="rotwood-toast mt-2 flex justify-center">
                  <Stars count={lastReward.starsEarned} size={27} />
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ResultMetric label="Wave reached" value={state.wave} />
              <ResultMetric label="Zombies killed" value={state.kills} />
              <ResultMetric label="Coins earned" value={`+${lastReward?.coins ?? 0}`} />
              <ResultMetric label="XP earned" value={`+${lastReward?.xp ?? 0}`} />
            </div>

            {lastReward?.newRecord && (
              <div className="rotwood-toast mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-center">
                <p className="rotwood-display text-2xl text-accent">NEW RECORD</p>
                <p className="text-xs text-panel-muted">Your best defense just moved forward.</p>
              </div>
            )}

            {lastReward?.stageCompleted && (
              <div className="mt-3 rotwood-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <Kicker>Stage mastery</Kicker>
                  <Stars count={lastReward.bestStars ?? 0} size={15} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {evaluateStageObjectives(activeStage.objectives, {
                    stageCompleted: true,
                    baseHealth: state.baseHp,
                    baseMaxHealth: state.baseMaxHp,
                    towersPlaced: state.towersPlaced,
                    uniqueTowerKinds: state.uniqueTowerKinds.length,
                    maxKillStreak: state.maxKillStreak,
                  }).results.map((result, index) => (
                    <div key={result.objective.id} className="flex items-center gap-2 text-xs">
                      <span className={result.passed ? "text-accent" : "text-panel-muted"}>
                        {index + 1}
                      </span>
                      <span className={result.passed ? "text-panel-foreground" : "text-panel-muted"}>
                        {result.objective.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <ScreenButton
                onClick={state.stageWon ? () => setScreen("stage-select") : () => startStage(activeStageId)}
                icon={state.stageWon ? <ChevronRight size={18} /> : <RotateCcw size={17} />}
              >
                {state.stageWon ? "CONTINUE" : "RETRY"}
              </ScreenButton>
              {state.stageWon && (
                <ScreenButton
                  onClick={() => startStage(activeStageId)}
                  variant="secondary"
                  icon={<RotateCcw size={17} />}
                >
                  REPLAY
                </ScreenButton>
              )}
              <ScreenButton onClick={leaveToMainMenu} variant="ghost">
                MAIN MENU
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "gameplay" && overlay === "pause" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-3">
          <ScreenCard>
            <div className="text-center">
              <Kicker>Defense halted</Kicker>
              <h2 className="rotwood-display mt-1 text-4xl text-panel-foreground">PAUSED</h2>
            </div>
            <div className="mt-4 space-y-2">
              <ScreenButton onClick={() => setOverlay(null)} icon={<Swords size={18} />}>
                RESUME
              </ScreenButton>
              <ScreenButton onClick={() => setOverlay("confirm-restart")} variant="secondary" icon={<RotateCcw size={17} />}>
                RESTART
              </ScreenButton>
              <ScreenButton onClick={leaveToStageSelect} variant="secondary">
                STAGE SELECT
              </ScreenButton>
              <ScreenButton onClick={() => openSettings("gameplay")} variant="ghost" icon={<Settings2 size={17} />}>
                SETTINGS
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}

      {screen === "gameplay" && overlay === "confirm-restart" && (
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-3">
          <ScreenCard>
            <div className="text-center">
              <Kicker>Confirm command</Kicker>
              <h3 className="rotwood-display mt-1 text-3xl text-panel-foreground">RESTART STAGE?</h3>
              <p className="mt-2 text-sm text-panel-muted">
                Current run progress will be lost.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <ScreenButton onClick={() => startStage(activeStageId)} icon={<RotateCcw size={17} />}>
                YES, RESTART
              </ScreenButton>
              <ScreenButton onClick={() => setOverlay("pause")} variant="ghost" icon={<ArrowLeft size={17} />}>
                BACK
              </ScreenButton>
            </div>
          </ScreenCard>
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-black/20 px-2 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-panel-muted">{label}</p>
      <div className="mt-0.5 flex min-h-5 items-center text-sm font-extrabold tabular-nums text-panel-foreground">
        {value}
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rotwood-card px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-panel-muted">{label}</p>
      <p className="rotwood-display mt-1 text-xl text-panel-foreground">{value}</p>
    </div>
  );
}

function ShortcutTile({
  title,
  subtitle,
  icon,
  badge,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rotwood-card min-h-[78px] p-3 text-left transition active:scale-[0.98]">
      <span className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/25 text-accent">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="rotwood-display block text-base text-panel-foreground">{title}</span>
          <span className="mt-0.5 block truncate text-[10px] text-panel-muted">{subtitle}</span>
        </span>
        {badge ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-black text-accent-foreground">
            {badge}
          </span>
        ) : (
          <ChevronRight size={15} className="text-panel-muted" />
        )}
      </span>
    </button>
  );
}

function ShieldMark({ size = 21 }: { size?: number } = {}) {
  return (
    <span
      className="grid place-items-center rounded-[30%] border-2 border-current"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="h-[42%] w-[42%] rounded-full border border-current" />
    </span>
  );
}
