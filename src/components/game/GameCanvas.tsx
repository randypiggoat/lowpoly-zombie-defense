import { Canvas } from "@react-three/fiber";
import { Coins, Gem, Gift, Settings2, ShoppingBag, Sparkles, Swords, Trophy, Wrench } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { HUD } from "./HUD";
import { Scene, type Selection } from "./Scene";
import { isMuted, setMuted, sfx, unlockAudio } from "@/game/audio";
import { TOWER_INFO, TOWER_KINDS, TOWER_PATHS, game, type TowerKind } from "@/game/engine";
import {
  STAGE_DEFS,
  evaluateStageObjectives,
  getNextStageId,
  getStageById,
  stageUnlockRequirementText,
  type PrimaryScreen,
} from "@/game/navigation";
import {
  ACHIEVEMENT_DEFS,
  DAILY_LOGIN_REWARDS,
  DAILY_MISSION_DEFS,
  dateKey,
  profile,
  xpForLevel,
} from "@/game/profile";
import { TOWER_COSMETICS } from "@/game/collection";
import {
  createEndlessStage,
  ENDLESS_CHALLENGES,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeekKey,
  type EndlessChallenge,
} from "@/game/endless";
import {
  BOSS_TRIAL_ROSTER,
  getWeeklyBossTrial,
  type BossTrialDefinition,
} from "@/game/bossTrials";
import { getSeasonalEvent, getSeasonalEventCycleKey, getSeasonalEventEnd } from "@/game/liveOps";
import { track } from "@/game/analytics";
import { isPurchaseAvailable, purchase } from "@/game/monetization";
import { STORE_CATALOG, storeItemStatus } from "@/game/storeCatalog";
import type { PurchaseProduct } from "@/game/monetization";
import { getWaveThreatPreview } from "@/game/waveThreatPreview";
import { FIELD_KNOWLEDGE, knowledgeUnlocked } from "@/game/fieldKnowledge";
import { getStageMapByStageId } from "@/game/maps";
import { getStageTheme } from "@/game/stageThemes";
import { nextTowerUnlock, towerUnlockRole } from "@/game/progression";

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
  className?: string;
};

function ScreenButton({ children, onClick, variant = "primary", disabled, className = "" }: ScreenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => sfx("uiClick")}
      disabled={disabled}
      className={`rotwood-button rotwood-button-${variant} w-full text-sm ${className}`}
    >
      {children}
    </button>
  );
}

function MenuTile({
  title,
  subtitle,
  badge,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => sfx("uiClick")}
      className="rotwood-menu-tile group min-h-[68px] w-full px-3 py-2.5 text-left"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-display text-sm tracking-wide text-panel-foreground">{title}</span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-semibold text-accent-foreground">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block line-clamp-2 text-[9px] leading-tight text-panel-muted">
        {subtitle}
      </span>
    </button>
  );
}

function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <div className="rotwood-shell max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto p-4">
      {children}
    </div>
  );
}

function ShieldMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-[28%] border-2 border-current"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="h-[42%] w-[42%] rounded-full border border-current" />
    </span>
  );
}

function HomeCurrency({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rotwood-currency">
      <span className="text-accent">{icon}</span>
      <span className="rotwood-display text-base tabular-nums text-panel-foreground">{value.toLocaleString()}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-panel-muted">{label}</span>
    </div>
  );
}

function HomeMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-panel-muted">{label}</p>
      <div className="mt-0.5 text-sm font-extrabold tabular-nums text-panel-foreground">{value}</div>
    </div>
  );
}

function HomeShortcut({
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
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => sfx("uiClick")}
      className="rotwood-menu-tile min-h-[76px] w-full px-3 py-2.5 text-left"
    >
      <span className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-accent">
          {icon}
        </span>
        <span className="min-w-0 flex-1 pr-5">
          <span className="block truncate font-display text-base tracking-wide text-panel-foreground">{title}</span>
          <span className="mt-0.5 block truncate text-[10px] text-panel-muted">{subtitle}</span>
        </span>
        {badge ? (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1 text-[10px] font-black text-accent-foreground">
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function UpgradeReference({ kind }: { kind: TowerKind }) {
  const paths = TOWER_PATHS[kind];
  return (
    <div className="mt-3 space-y-2">
      {(["a", "b"] as const).map((path) => (
        <section key={path} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-sm tracking-[0.12em] text-panel-foreground">{paths[path].name}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-panel-muted">{paths[path].focus}</p>
            </div>
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-accent">Path</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {paths[path].tiers.map((tier) => (
              <div key={tier.name} className="rounded-xl border border-white/5 bg-black/15 px-2.5 py-2">
                <p className="font-display text-[11px] tracking-wide text-panel-foreground">{tier.name}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-panel-muted">{tier.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function StageRoutePreview({ stageId }: { stageId: number }) {
  const map = getStageMapByStageId(stageId);
  const theme = getStageTheme(stageId, false, false);
  const xs = map.path.map((point) => point.x);
  const zs = map.path.map((point) => point.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxZ - minZ);
  const pad = 2;
  const viewWidth = width + pad * 2;
  const viewHeight = height + pad * 2;
  const point = (value: { x: number; z: number }) =>
    (value.x - minX + pad) + "," + (maxZ - value.z + pad);
  const d = map.path.map((value, index) => (index === 0 ? "M " : "L ") + point(value)).join(" ");
  const start = point(map.path[0]!).split(",");
  const end = point(map.path[map.path.length - 1]!).split(",");
  const obstacleRect = (obstacle: { x: number; z: number; width: number; depth: number }) => ({
    x: obstacle.x - minX + pad - obstacle.width / 2,
    y: maxZ - obstacle.z + pad - obstacle.depth / 2,
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20 p-2">
      <svg
        viewBox={"0 0 " + viewWidth + " " + viewHeight}
        className="h-24 w-full"
        role="img"
        aria-label={"Map preview for " + map.name}
      >
        <rect width="100%" height="100%" rx="1.25" fill={theme.ground} />
        <rect width="100%" height="100%" rx="1.25" fill={theme.groundAlt} opacity="0.3" />
        {map.obstacles.map((obstacle, index) => {
          const rect = obstacleRect(obstacle);
          return (
            <rect
              key={obstacle.label + "-" + index}
              x={rect.x}
              y={rect.y}
              width={obstacle.width}
              height={obstacle.depth}
              rx="0.35"
              fill={theme.pathEdge}
              opacity="0.58"
            />
          );
        })}
        <path
          d={d}
          fill="none"
          stroke={theme.pathEdge}
          strokeWidth={Math.max(2.2, map.pathWidth * 0.92)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.68"
        />
        <path
          d={d}
          fill="none"
          stroke={theme.path}
          strokeWidth={Math.max(1.35, map.pathWidth * 0.54)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={start[0]} cy={start[1]} r="1.05" fill={theme.marker} />
        <circle cx={end[0]} cy={end[1]} r="1.05" fill={theme.light} />
      </svg>
      <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-panel-muted">
        {map.path.length - 1} path segments · blockers shown
      </span>
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
  const [placementPreview, setPlacementPreview] = useState<{ x: number; z: number } | null>(null);
  const placementPreviewRef = useRef<{ x: number; z: number } | null>(null);
  const [screen, setScreen] = useState<PrimaryScreen>("main-menu");

  useEffect(() => {
    placementPreviewRef.current = placementPreview;
  }, [placementPreview]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settingsBackScreen, setSettingsBackScreen] = useState<PrimaryScreen>("main-menu");
  const [activeStageId, setActiveStageId] = useState(1);
  const [activeChallenge, setActiveChallenge] = useState<EndlessChallenge | null>(null);
  const [activeBossTrial, setActiveBossTrial] = useState<BossTrialDefinition | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [canvasReady, setCanvasReady] = useState(false);
  const [rewardedAvailable, setRewardedAvailable] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<Partial<Record<PurchaseProduct, boolean>>>({});
  const [armoryTowerKind, setArmoryTowerKind] = useState<TowerKind>("rifleman");
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
  const dailyLoginReward =
    DAILY_LOGIN_REWARDS.find((entry) => entry.day === player.loginCycleDay) ??
    DAILY_LOGIN_REWARDS[0]!;
  const dailyLoginAvailable = player.lastLoginClaimDate !== todayKey;
  const dailyBonusAvailable =
    !player.adsRemoved && rewardedAvailable && profile.canClaimDailyRewardedBonus;
  const nextStageId = getNextStageId(activeStageId);
  const nextStage = nextStageId === null ? null : getStageById(nextStageId);
  const readyMissionCount = DAILY_MISSION_DEFS.filter((mission) => {
    const progress = player.dailyMissionProgress[mission.id];
    return Boolean(progress?.completed && !progress.claimed);
  }).length;
  const nextTower = nextTowerUnlock(player.level, player.unlockedTowers);
  const currentLevelXp = player.xp;
  const currentLevelTarget = xpForLevel(player.level);
  const readyAchievementCount = ACHIEVEMENT_DEFS.filter((achievement) => {
    const progress = player.achievements[achievement.id];
    return Boolean(progress?.completed && !progress.claimed);
  }).length;

  const resetGameplayState = () => {
    profile.clearReward();
    game.reset();
    setSelection(null);
    setPlacementPreview(null);
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
    let active = true;
    setCanvasReady(true);
    void import("@/game/monetization")
      .then(({ installCapacitorAdMobProvider, isRewardedAvailable }) => {
        if (!active) return;
        installCapacitorAdMobProvider();
        setRewardedAvailable(isRewardedAvailable());
      })
      .catch(() => {
        if (active) setRewardedAvailable(false);
      });
    return () => {
      active = false;
    };
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
  const resultLabel = state.bossTrial
    ? state.stageWon
      ? "TRIAL CLEARED"
      : "TRIAL FAILED"
    : state.endlessMode
      ? "SIEGE OVER"
      : state.stageWon
        ? "STAGE COMPLETE"
        : "GAME OVER";

  const endlessBestDisplay = state.challengePeriod === "daily"
    ? player.dailyChallengeBestScore
    : state.challengePeriod === "weekly"
      ? player.weeklyChallengeBestScore
      : player.endlessBestScore;

  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(window.location.search).has("qa")) return;

    type QaApi = {
      buildTower: (spot: number, kind: TowerKind) => boolean;
      buildTowerAt: (x: number, z: number, kind: TowerKind) => boolean;
      getPlacementPreview: () => { x: number; z: number } | null;
      getPlacementStatus: () => { valid: boolean; reason: string } | null;
      getTowerPositions: () => Array<{ id: number; x: number; z: number; kind: TowerKind }>;
      getCombatSnapshot: () => { towerCount: number; projectileKinds: TowerKind[]; projectileEmissions: number };
    };

    const qaWindow = window as Window & { __ROTWOOD_QA__?: QaApi };
    qaWindow.__ROTWOOD_QA__ = {
      buildTower: (spot, kind) => game.build(spot, kind),
      buildTowerAt: (x, z, kind) => game.buildAt(x, z, kind),
      getPlacementPreview: () => placementPreviewRef.current,
      getPlacementStatus: () => {
        const point = placementPreviewRef.current;
        return point ? game.getPlacementStatus(point.x, point.z) : null;
      },
      getTowerPositions: () =>
        game.state.towers.map((tower) => ({
          id: tower.id,
          x: tower.x,
          z: tower.z,
          kind: tower.kind,
        })),
      selectTower: (id) => setSelection({ kind: "tower", id }),
      getTowerIds: () => game.state.towers.map((tower) => tower.id),
      getCombatSnapshot: () => ({
        towerCount: game.state.towers.length,
        projectileKinds: game.state.bullets.map((bullet) => bullet.kind),
        projectileEmissions: game.getProjectileEmissionCount(),
      }),
    };

    return () => {
      delete qaWindow.__ROTWOOD_QA__;
    };
  }, []);

  const weekKey = getWeekKey();
  const dailyChallenge = getDailyChallenge(todayKey);
  const weeklyChallenge = getWeeklyChallenge(weekKey);
  const weeklyBossTrial = getWeeklyBossTrial(weekKey);
  const seasonalEvent = getSeasonalEvent();
  const seasonalCycleKey = getSeasonalEventCycleKey();
  const seasonalEventEnd = getSeasonalEventEnd();
  const readyEventCount = seasonalEvent.milestones.filter((milestone) => {
    const progress = Math.min(milestone.target, player.seasonalEventProgress);
    return progress >= milestone.target && !player.seasonalEventClaims.includes(milestone.id);
  }).length;

  return (
    <div className="rotwood-app fixed inset-0 overflow-hidden bg-sky" data-screen={screen} data-reduced-motion={player.reducedMotion ? "true" : "false"} onPointerDown={() => unlockAudio()}>
      {canvasReady && (
        <Canvas
          // Use the cheaper supported shadow mode; Three r185 deprecates PCFSoftShadowMap.
          shadows="basic"
          // Keep pixel fill-rate predictable on mobile GPUs to reduce WebGL context resets.
          dpr={1}
          gl={{
            antialias: false,
            powerPreference: "low-power",
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [2, 26, 30], fov: 40 }}
          onCreated={({ gl }) => {
            gl.setClearColor("#8fc4d8");
          }}
        >
          <Scene
            stageId={state.stageId}
            endlessMode={state.endlessMode}
            paused={paused}
            reducedMotion={player.reducedMotion}
            bossTrial={state.bossTrial}
            towers={state.towers}
            selection={selection}
            previewPosition={placementPreview}
            onSelectTower={(id) => {
              setPlacementPreview(null);
              setSelection({ kind: "tower", id });
            }}
            onSelectPosition={(position) => {
              setPlacementPreview(position);
              setSelection({ kind: "spot", position });
            }}
            onPreviewPosition={setPlacementPreview}
          />
        </Canvas>
      )}

      {screen === "gameplay" && (
        <>
          <HUD
            state={state}
            selection={selection}
            onSelect={(next) => {
              if (next?.kind === "tower") setPlacementPreview(null);
              setSelection(next);
            }}
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
        <div className="rotwood-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pb-[calc(4.5rem+max(0.75rem,env(safe-area-inset-bottom)))]">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-panel-muted">Last defense network</p>
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

            <ScreenCard>
              <div className="rotwood-card rotwood-shine p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <ShieldMark size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-panel-muted">Defense profile</p>
                    <p className="rotwood-display text-2xl text-panel-foreground">LEVEL {player.level}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: Math.min(100, (currentLevelXp / Math.max(1, currentLevelTarget)) * 100) + "%" }} />
                    </div>
                    <p className="mt-1 text-[9px] text-panel-muted">{currentLevelXp} / {currentLevelTarget} XP to the next level</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
                  <HomeCurrency icon={<Coins size={15} />} value={player.coins} label="Credits" />
                  <HomeCurrency icon={<Gem size={15} />} value={player.gems} label="Gems" />
                  <HomeMetric label="Best Wave" value={player.highestWave} />
                </div>
                {nextTower ? (
                  <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-accent">Next tower</p>
                        <p className="font-display text-sm tracking-wide text-panel-foreground">{TOWER_INFO[nextTower.kind].name}</p>
                      </div>
                      <p className="text-right text-[9px] text-panel-muted">LEVEL {nextTower.level}<br />{towerUnlockRole(nextTower.kind)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-accent">Full tower roster unlocked</p>
                )}
              </div>
              <div className="rotwood-card rotwood-card-highlight mt-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Next defense</p>
                    <h2 className="rotwood-display mt-1 text-2xl leading-none text-panel-foreground">
                      STAGE {recommendedStage.stageNumber} · {recommendedStage.name}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-panel-muted">{recommendedStage.description}</p>
                  </div>
                  <div className="rounded-lg border border-accent/20 bg-accent/10 px-2 py-1 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-panel-muted">Difficulty</p>
                    <p className="rotwood-display text-sm text-accent">{recommendedStage.difficulty}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-panel-muted">
                  <span>Best wave {recommendedStage.bestWave || "—"}</span>
                  <span aria-hidden="true">•</span>
                  <span className="text-accent">{"★".repeat(recommendedStage.stars) || "No stars yet"}</span>
                </div>
                <ScreenButton
                  className="mt-3"
                  onClick={() => {
                    resetGameplayState();
                    setActiveStageId(recommendedStage.id);
                    if (isFirstRun) track("menu_quick_play", { stageId: recommendedStage.id });
                    game.startStage(recommendedStage);
                    setScreen("gameplay");
                  }}
                  >
                  {isFirstRun ? "DEFEND NOW" : "CONTINUE DEFENSE"}
                </ScreenButton>
              </div>

              <div className="rotwood-card mt-2 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Gift size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-panel-muted">Daily supply drop</p>
                    <p className="rotwood-display text-lg text-panel-foreground">
                      DAY {player.loginCycleDay}/7 · {dailyLoginReward.title}
                    </p>
                    <p className="text-xs text-panel-muted">{dailyLoginReward.reward.label}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!dailyLoginAvailable}
                    onClick={() => {
                      if (!profile.claimDailyLoginReward()) return;
                      track("daily_login_claimed", { day: dailyLoginReward.day, reward: dailyLoginReward.reward.label });
                    }}
                    className="rotwood-button rotwood-button-primary min-h-11 shrink-0 px-3 text-xs disabled:opacity-50"
                  >
                    {dailyLoginAvailable ? "CLAIM" : "CLAIMED"}
                  </button>
                </div>
              </div>

              {!player.adsRemoved && (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-panel-foreground">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-panel-muted">Optional bonus</p>
                      <p className="rotwood-display text-base text-panel-foreground">+150 CREDITS · +1 GEM</p>
                      <p className="text-[10px] text-panel-muted">One voluntary rewarded ad per day.</p>
                    </div>
                    <button
                      type="button"
                      disabled={!dailyBonusAvailable}
                      onClick={async () => {
                        const { showRewarded } = await import("@/game/monetization");
                        const earned = await showRewarded("daily-bonus");
                        if (earned && profile.claimDailyRewardedBonus()) {
                          track("daily_rewarded_bonus_claimed", { coins: 150, gems: 1 });
                        }
                      }}
                      className="rotwood-button rotwood-button-secondary min-h-11 shrink-0 px-3 text-[10px]"
                    >
                      {dailyBonusAvailable ? "WATCH" : "DONE"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-panel-muted">Play</p>
                <div className="space-y-1.5">
                  <MenuTile title="Campaign" subtitle="Structured progression, stars, and the main tower-unlock path." onClick={() => setScreen("stage-select")} />
                  <MenuTile title="Endless Siege" subtitle="Build experimentation, records, and long-run mastery." onClick={() => setScreen("endless-select")} />
                  <MenuTile title="Boss Trials" subtitle="Recurring boss mastery with rotating variants." onClick={() => setScreen("boss-trial-select")} />
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-panel-muted">Build your collection</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <HomeShortcut title="Armory" subtitle="Towers, roles & mastery" icon={<Wrench size={18} />} onClick={() => setScreen("towers")} />
                  <HomeShortcut title="Knowledge" subtitle="Permanent run modifiers" icon={<Sparkles size={18} />} onClick={() => setScreen("knowledge")} />
                  <HomeShortcut title="Collection" subtitle="Earned cosmetics" icon={<Sparkles size={18} />} onClick={() => setScreen("collection")} />
                  <HomeShortcut title="Goals" subtitle="Missions & achievements" icon={<Trophy size={18} />} badge={(readyMissionCount + readyAchievementCount) || undefined} onClick={() => setScreen("achievements")} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <HomeShortcut title="Events" subtitle="Rotating challenges" icon={<Swords size={18} />} badge={readyEventCount || undefined} onClick={() => setScreen("events")} />
                <HomeShortcut title="Shop" subtitle="Optional extras" icon={<ShoppingBag size={18} />} onClick={() => setScreen("shop")} />
              </div>
            </ScreenCard>
          </div>
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

      {screen === "boss-trial-select" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/72 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">
              ← BACK
            </ScreenButton>
            <div className="mt-3 rounded-2xl border border-accent/25 bg-panel/95 p-3 text-panel-foreground shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Weekly rotation</p>
              <h2 className="font-display text-2xl tracking-wide">Boss Trials</h2>
              <p className="mt-1 text-xs text-panel-muted">
                One elite boss gets a dedicated eight-wave hard encounter each week. Every boss has its own rule set.
              </p>
              <div className="mt-2 rounded-xl bg-black/30 px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.2em] text-panel-muted">This week</p>
                <p className="font-display text-lg text-accent">
                  {weeklyBossTrial.bossName} · {weeklyBossTrial.title}
                </p>
                <p className="text-xs text-panel-muted">
                  {weeklyBossTrial.variant?.name} · {weeklyBossTrial.variant?.description}
                </p>
                <p className="mt-1 text-[10px] text-panel-muted">
                  Best score: {player.bossTrialWeekKey === weekKey ? player.bossTrialBestScore.toLocaleString() : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {BOSS_TRIAL_ROSTER.map((trial) => {
                const active = trial.id === weeklyBossTrial.id;
                return (
                  <div
                    key={trial.id}
                    className={
                      "rounded-2xl border bg-panel/95 p-3 shadow-panel " +
                      (active ? "border-accent/45" : "border-white/10 opacity-75")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-accent">
                          {active ? "ACTIVE THIS WEEK" : "WEEKLY ROTATION"}
                        </p>
                        <h3 className="font-display text-xl tracking-wide text-panel-foreground">
                          {trial.bossName} · {trial.title}
                        </h3>
                        <p className="mt-1 text-xs text-panel-muted">{trial.description}</p>
                      </div>
                      <span className="rounded-full bg-black/30 px-2 py-1 text-[10px] text-panel-muted">
                        {trial.variants.length} variants
                      </span>
                    </div>
                    {active && (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {[
                            trial.variant?.name ?? trial.title,
                            "8 WAVES",
                            "NO RANDOM POWERS",
                            "HARD",
                          ].map((label) => (
                            <span key={label} className="rounded-full bg-accent/10 px-2 py-1 text-[9px] uppercase tracking-wider text-accent">
                              {label}
                            </span>
                          ))}
                        </div>
                        <ScreenButton
                          onClick={() => {
                            resetGameplayState();
                            setActiveBossTrial(weeklyBossTrial);
                            game.startBossTrial(weeklyBossTrial, weekKey);
                            setScreen("gameplay");
                          }}
                        >
                          ENTER TRIAL
                        </ScreenButton>
                      </>
                    )}
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
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>
            <div className="mt-3 rounded-2xl border border-white/10 bg-panel/95 p-3 text-panel-foreground shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Campaign</p>
              <h2 className="font-display text-2xl tracking-wide">20 Locations · 4 Worlds</h2>
              <p className="mt-1 text-xs text-panel-muted">Choose a route and defend it. Each world introduces a new environment language and tactical rhythm.</p>
            </div>
            <div className="mt-3 space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  data-stage-id={stage.id}
                  data-world-id={stage.worldId}
                  className={"rounded-2xl border bg-panel/95 p-3 text-panel-foreground shadow-panel " + (stage.locked ? "border-white/5 opacity-75" : "border-white/10")}
                >
                  <p className="mb-1 text-[9px] uppercase tracking-[0.18em] text-accent">
                    World {stage.worldId} · {stage.worldName}
                  </p>
                  <StageRoutePreview stageId={stage.id} />
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-lg tracking-wide">STAGE {stage.stageNumber}</p>
                      <p className="font-display text-base tracking-wide">{stage.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-panel-muted">{stage.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-sm tracking-wide text-accent">{stage.difficulty}</p>
                      <p className="mt-1 text-base text-accent" aria-label={stage.stars + " stars"}>{"★".repeat(stage.stars) || "☆"}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-panel-muted">
                    <span>{stage.locked ? stage.requiredText.toUpperCase() : stage.completed ? "COMPLETED" : "READY"}</span>
                    {!stage.locked && stage.bestWave > 0 ? <span>BEST WAVE {stage.bestWave}</span> : null}
                  </div>
                  <div className="mt-2">
                    {stage.locked ? <div className="rounded-xl bg-black/25 px-3 py-2 text-center text-xs text-panel-muted">🔒 {stage.requiredText}</div> : <ScreenButton onClick={() => startStage(stage.id)}>{stage.completed ? "REPLAY" : "PLAY"}</ScreenButton>}
                  </div>
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
                          <button type="button" disabled={!unlocked} onClick={() => profile.equipTowerCosmetic(targetKind, cosmetic.id)} className="mt-2 min-h-11 w-full rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40">
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
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Tower guide</p>
              <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Armory</h2>
              <p className="mt-1 text-xs text-panel-muted">Learn each tower’s role and every upgrade path. Combat numbers stay in battle.</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TOWER_KINDS.map((kind) => {
                const info = TOWER_INFO[kind];
                const unlocked = info.coinUnlock === 0 || player.level >= info.unlockLevel || player.unlockedTowers.includes(kind);
                const active = armoryTowerKind === kind;
                return (
                  <button key={kind} type="button" onClick={() => setArmoryTowerKind(kind)} data-active={active} className="rounded-2xl border bg-panel/95 p-3 text-left shadow-panel transition active:scale-[0.99] data-[active=true]:border-accent/50 data-[active=true]:bg-accent/5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: info.accent }} />
                      <p className="truncate font-display text-sm tracking-wide text-panel-foreground">{info.name}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-panel-muted">{info.blurb}</p>
                    <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-accent">{unlocked ? "AVAILABLE" : "LOCKS LATER"}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Tower overview</p>
              <h3 className="font-display text-xl tracking-wide text-panel-foreground">{TOWER_INFO[armoryTowerKind].name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-panel-muted">{TOWER_INFO[armoryTowerKind].blurb}</p>
              <UpgradeReference kind={armoryTowerKind} />
            </div>
          </div>
        </div>
      )}
{screen === "knowledge" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/72 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>
            <div className="mt-3 rounded-2xl border border-accent/25 bg-panel/95 p-3 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Permanent progression</p>
                  <h2 className="font-display text-2xl tracking-wide text-panel-foreground">Field Knowledge</h2>
                  <p className="mt-1 text-xs text-panel-muted">Spend CREDITS here. These perks stay equipped across runs.</p>
                </div>
                <div className="shrink-0 rounded-xl bg-black/30 px-3 py-2 text-right">
                  <p className="font-display text-base text-accent">{player.coins.toLocaleString()}</p>
                  <p className="text-[8px] uppercase tracking-wider text-panel-muted">Credits</p>
                </div>
              </div>
            </div>
            {(["ARSENAL", "FIELDCRAFT", "SALVAGE"] as const).map((category) => (
              <section key={category} className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="font-display text-sm tracking-[0.16em] text-panel-foreground">{category}</p>
                  <p className="text-[9px] uppercase tracking-wider text-panel-muted">{FIELD_KNOWLEDGE.filter((n) => n.category === category && player.fieldKnowledge[n.id] === 1).length} / 4</p>
                </div>
                <div className="space-y-1.5">
                  {FIELD_KNOWLEDGE.filter((node) => node.category === category).map((node) => {
                    const owned = player.fieldKnowledge[node.id] === 1;
                    const open = profile.canUnlockFieldKnowledge(node.id);
                    const enough = player.coins >= node.cost;
                    const locked = !owned && !open;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        disabled={owned || locked || !enough}
                        onClick={() => profile.unlockFieldKnowledge(node.id)}
                        className="w-full rounded-xl border border-white/10 bg-panel/95 p-3 text-left shadow-panel transition active:scale-[0.99] disabled:opacity-55 data-[owned=true]:border-accent/40 data-[owned=true]:bg-accent/10"
                        data-owned={owned}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-sm tracking-wide text-panel-foreground">{node.name}</p>
                            <p className="mt-0.5 text-[10px] leading-tight text-panel-muted">{node.description}</p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-black/25 px-2 py-1 font-display text-[10px] text-accent">{owned ? "EQUIPPED" : locked ? "LOCKED" : node.cost + " CR"}</span>
                        </div>
                        {!owned && open && !enough && <p className="mt-1.5 text-[9px] uppercase tracking-wider text-panel-muted">{node.cost - player.coins} more credits</p>}
                        {!owned && open && enough && <p className="mt-1.5 text-[9px] uppercase tracking-wider text-accent">READY TO LEARN</p>}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
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
                  const completed = Boolean(progress?.completed);
                  const claimed = Boolean(progress?.claimed);
                  return (
                    <div key={mission.id} className="rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-panel-foreground">{mission.description}</p>
                          <p className="text-xs text-panel-muted">
                            Progress {Math.min(mission.target, progress?.progress ?? 0)}/
                            {mission.target} · Reward {mission.reward.label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onPointerDown={() => sfx("uiClick")}
                          onClick={() => profile.claimDailyMission(mission.id)}
                          disabled={!completed || claimed}
                          className="min-h-11 shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                        >
                          {claimed ? "CLAIMED" : completed ? "CLAIM" : "IN PROGRESS"}
                        </button>
                      </div>
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
                  const completed = Boolean(progress?.completed);
                  const claimed = Boolean(progress?.claimed);
                  return (
                    <div key={achievement.id} className="rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-panel-foreground">{achievement.title}</p>
                          <p className="text-xs text-panel-muted">{achievement.description}</p>
                          <p className="text-xs text-panel-muted">
                            Progress {Math.min(achievement.target, progress?.progress ?? 0)}/
                            {achievement.target} · Reward {achievement.reward.label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onPointerDown={() => sfx("uiClick")}
                          onClick={() => profile.claimAchievement(achievement.id)}
                          disabled={!completed || claimed}
                          className="min-h-11 shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                        >
                          {claimed ? "CLAIMED" : completed ? "CLAIM" : "LOCKED"}
                        </button>
                      </div>
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
                  <p className="text-sm text-accent">{player.coins.toLocaleString()} CREDITS</p>
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
                          className="min-h-11 w-full rounded-xl bg-accent px-3 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98]"
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
            <h2 className={"text-center font-display text-3xl tracking-wide " + (state.stageWon ? "text-accent" : state.endlessMode ? "text-accent" : "text-danger")}>{resultLabel}</h2>
            {state.bossTrial && activeBossTrial ? <p className="mt-1 text-center text-sm text-panel-muted">{activeBossTrial.bossName} · {activeBossTrial.title}</p> : state.endlessMode && activeChallenge ? <p className="mt-1 text-center text-sm text-panel-muted">{activeChallenge.name}</p> : <p className="mt-1 text-center text-xs text-panel-muted">{state.stageWon ? "Defense held. Your rewards are ready." : "The horde broke through. Try again or change your approach."}</p>}
            {lastReward ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">+{lastReward.coins}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">Credits</p></div>
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">+{lastReward.xp}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">XP</p></div>
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">{"★".repeat(lastReward.starsEarned ?? 0) || "—"}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">Stars</p></div>
              </div>
            ) : null}
            <div className="mt-3 rounded-2xl bg-black/25 p-3 text-center">
              {state.endlessMode || state.bossTrial ? (
                <><p className="text-[9px] uppercase tracking-[0.18em] text-panel-muted">{state.bossTrial ? "Trial score" : "Score"}</p><p className="mt-1 font-display text-2xl text-panel-foreground">{state.bossTrial ? state.bossTrialScore.toLocaleString() : lastReward && "score" in lastReward ? lastReward.score.toLocaleString() : "—"}</p></>
              ) : (
                <><p className="text-[9px] uppercase tracking-[0.18em] text-panel-muted">Wave reached</p><p className="mt-1 font-display text-2xl text-panel-foreground">{state.wave}</p></>
              )}
              {lastReward?.newRecord ? <p className="mt-1 font-display text-sm tracking-wide text-accent">NEW RECORD</p> : null}
            </div>
            {lastReward?.stageCompleted ? (
              <div className="mt-3 rounded-2xl bg-black/30 p-3 text-sm text-panel-foreground">
                <p className="text-[9px] uppercase tracking-[0.2em] text-panel-muted">Stage goals</p>
                <div className="mt-1 space-y-1">
                  {evaluateStageObjectives(activeStage.objectives, { stageCompleted: true, baseHealth: state.baseHp, baseMaxHealth: state.baseMaxHp, towersPlaced: state.towersPlaced, maxKillStreak: state.maxKillStreak, uniqueTowerKinds: state.uniqueTowerKinds.length }).results.map((result) => (
                    <p key={result.objective.id}>{result.passed ? "★" : "☆"} {result.objective.label}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {!state.stageWon && !state.reviveUsed && state.baseHp <= 0 && rewardedAvailable ? (
              <ScreenButton onClick={async () => { const { showRewarded } = await import("@/game/monetization"); const earned = await showRewarded("revive"); if (earned && game.reviveRun()) setScreen("gameplay"); }} variant="secondary">SECOND CHANCE · WATCH AD</ScreenButton>
            ) : null}
            {lastReward && !player.adsRemoved && rewardedAvailable && profile.canClaimLastRunRewardBoost ? (
              <ScreenButton onClick={async () => { const { showRewarded } = await import("@/game/monetization"); const earned = await showRewarded("double-run-rewards"); if (earned) profile.claimLastRunRewardBoost(); }} variant="secondary">DOUBLE REWARDS · WATCH AD</ScreenButton>
            ) : null}
            <div className="mt-4 space-y-2">
              {state.stageWon && nextStage ? <ScreenButton onClick={() => startStage(nextStage.id)}>NEXT STAGE</ScreenButton> : state.stageWon ? <ScreenButton onClick={leaveToStageSelect}>CAMPAIGN</ScreenButton> : state.bossTrial && activeBossTrial ? <ScreenButton onClick={() => { resetGameplayState(); game.startBossTrial(activeBossTrial, weekKey); setScreen("gameplay"); }}>RETRY TRIAL</ScreenButton> : state.endlessMode && activeChallenge ? <ScreenButton onClick={() => { resetGameplayState(); game.startEndless(activeChallenge, activeChallenge.period === "weekly" ? weekKey : todayKey); setScreen("gameplay"); }}>RETRY</ScreenButton> : <ScreenButton onClick={() => startStage(activeStageId)}>RETRY</ScreenButton>}
              {state.stageWon ? <ScreenButton onClick={() => startStage(activeStageId)} variant="secondary">REPLAY</ScreenButton> : null}
              <ScreenButton onClick={() => state.bossTrial ? setScreen("boss-trial-select") : state.endlessMode ? setScreen("endless-select") : setScreen("stage-select")} variant="secondary">{state.bossTrial ? "BOSS TRIALS" : state.endlessMode ? "ENDLESS" : "CAMPAIGN"}</ScreenButton>
              <ScreenButton onClick={leaveToMainMenu} variant="secondary">MAIN MENU</ScreenButton>
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
