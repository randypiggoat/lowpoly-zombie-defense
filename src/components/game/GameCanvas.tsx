import { RUN_MODIFIER_DEFS } from "@/game/runModifiers";
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
  CAMPAIGN_REPLAY_CHALLENGES,
  STAGE_DEFS,
  campaignReplayProgressKey,
  evaluateStageObjectives,
  getNextStageId,
  getStageById,
  stageUnlockRequirementText,
  type CampaignReplayChallengeDefinition,
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
import { TOWER_COSMETICS, ZOMBIE_COSMETICS } from "@/game/collection";
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
import {
  getSeasonalEvent,
  getSeasonalEventCycleKey,
  getSeasonalEventEnd,
  getSeasonalMilestoneProgress,
} from "@/game/liveOps";
import { track } from "@/game/analytics";
import { isPurchaseAvailable, purchase } from "@/game/monetization";
import { STORE_CATALOG, storeItemStatus } from "@/game/storeCatalog";
import type { PurchaseProduct } from "@/game/monetization";
import { getWaveThreatPreview } from "@/game/waveThreatPreview";
import { FIELD_KNOWLEDGE, knowledgeUnlocked } from "@/game/fieldKnowledge";
import { getStageMapByStageId } from "@/game/maps";
import { getStageTheme } from "@/game/stageThemes";
import { nextTowerUnlock, towerUnlockRole } from "@/game/progression";
import { CHALLENGE_GAUNTLET, RESOURCE_OPS, getSeasonalEventRun, type SideModeLevel } from "@/game/sideModes";

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

function OutbreakIllustration() {
  return (
    <svg viewBox="0 0 620 260" className="rw-outbreak-art" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rw-night-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#21364b" /><stop offset="58%" stopColor="#172838" /><stop offset="100%" stopColor="#101923" /></linearGradient>
        <radialGradient id="rw-moon-glow"><stop offset="0%" stopColor="#d8e69f" stopOpacity=".38" /><stop offset="100%" stopColor="#a4d18a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="620" height="260" fill="url(#rw-night-sky)" />
      <circle cx="455" cy="58" r="76" fill="url(#rw-moon-glow)" /><circle cx="455" cy="58" r="22" fill="#d9e6b3" opacity=".85" /><circle cx="455" cy="58" r="15" fill="#b5c98f" opacity=".58" />
      <path d="M0 146 82 96 132 127 205 76 264 124 326 92 383 137 452 98 529 140 620 102V260H0Z" fill="#263d4d" />
      <path d="M0 174 78 135 143 159 213 112 276 162 348 124 408 156 482 119 550 169 620 140V260H0Z" fill="#1b303c" />
      <g fill="#15232f" stroke="#496072" strokeOpacity=".35" strokeWidth="2">
        <path d="M254 150V69L284 51 307 70V150Z" /><path d="M283 61 307 70 307 150 283 150Z" fill="#203441" />
        <path d="M317 150V96L343 81 363 96V150Z" /><path d="M365 151V62L396 42 421 62V151Z" />
        <path d="M396 42 421 62 421 151 396 151Z" fill="#203541" /><path d="M431 150V105L454 88 474 105V150Z" />
        <path d="M483 150V77L506 65 529 79V150Z" /><path d="M506 65 529 79V150H506Z" fill="#243c4a" />
        <path d="M540 150V111L559 99 578 111V150Z" />
      </g>
      <g fill="#d4b66b" opacity=".65">
        <rect x="270" y="84" width="5" height="8" /><rect x="294" y="85" width="5" height="8" /><rect x="271" y="105" width="5" height="8" /><rect x="294" y="105" width="5" height="8" />
        <rect x="379" y="76" width="6" height="9" /><rect x="405" y="76" width="6" height="9" /><rect x="379" y="98" width="6" height="9" /><rect x="405" y="98" width="6" height="9" />
        <rect x="491" y="91" width="5" height="8" /><rect x="515" y="91" width="5" height="8" /><rect x="491" y="111" width="5" height="8" /><rect x="515" y="111" width="5" height="8" />
      </g>
      <path d="M0 197 86 173 148 188 222 159 278 187 343 163 395 188 463 164 522 186 620 156V260H0Z" fill="#172732" />
      <g stroke="#789b91" strokeWidth="2" strokeOpacity=".75" fill="none"><path d="M346 161V114H377V89" /><path d="M336 141H356" /><path d="M467 164V134H492" /></g>
      <g>
        <path d="M338 159V103L361 91 384 103V159Z" fill="#3a655f" stroke="#9bc98d" strokeOpacity=".65" strokeWidth="2" /><path d="M361 91 384 103V159H361Z" fill="#274b4b" />
        <path d="M333 103 361 84 389 103Z" fill="#6a8d6e" /><path d="M342 159V124L361 112 379 124V159Z" fill="#13242f" />
        <path d="M351 159V132H370V159" fill="none" stroke="#d6b967" strokeWidth="2" /><rect x="357" y="116" width="8" height="5" fill="#d7e8a0" />
      </g>
      <path d="M0 224 114 195 181 218 227 198 290 223 365 199 422 225 502 194 620 221V260H0Z" fill="#0f1a22" />
      <path d="M37 227 118 207 151 218 146 234 65 250Z" fill="#596a6b" /><path d="M65 250 146 234 146 243 65 260Z" fill="#35484e" />
      <path d="M155 230 224 211 263 225 259 241 186 258Z" fill="#667573" /><path d="M186 258 259 241 259 251 186 268Z" fill="#34454b" />
      <g fill="#101820" stroke="#0b1117" strokeWidth="3" strokeLinejoin="round">
        <path d="M511 190 513 161 527 151 541 163 543 190 552 210 536 214 530 192 522 212 507 210Z" /><path d="M514 162 505 174 498 187 506 191 519 178Z" /><path d="M537 165 550 174 561 189 555 194 538 181Z" />
        <path d="M564 205 565 179 578 170 591 181 592 205 601 222 586 225 578 206 572 224 558 222Z" /><path d="M566 181 557 190 555 201 562 202 574 191Z" /><path d="M588 183 602 193 609 208 603 211 589 198Z" />
      </g>
      <g fill="#c8e887"><path d="M518 162 525 160 530 164 526 168 519 167Z" /><path d="M570 181 577 178 581 182 578 186 571 186Z" /></g>
      <path d="M454 246 489 226 514 233 539 224 567 238 620 223V260H454Z" fill="#253d3d" /><path d="M0 252 65 242 109 255 163 244 220 257 290 244 346 260H0Z" fill="#3b594e" /><path d="M294 260 342 246 381 260Z" fill="#5c7c5e" /><path d="M412 260 464 244 493 260Z" fill="#54745b" />
    </svg>
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
function getEndlessSector(bestWave: number) {
  return Math.max(1, Math.ceil(Math.max(0, bestWave) / 5));
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
  const [expandedReplayStageId, setExpandedReplayStageId] = useState<number | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<EndlessChallenge | null>(null);
  const [activeBossTrial, setActiveBossTrial] = useState<BossTrialDefinition | null>(null);
  const [activeSideMode, setActiveSideMode] = useState<SideModeLevel | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [canvasReady, setCanvasReady] = useState(false);
  const [lowGraphics, setLowGraphics] = useState(true);
  const [rewardedAvailable, setRewardedAvailable] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<Partial<Record<PurchaseProduct, boolean>>>({});

  const handleSelectTower = useCallback((id: number) => {
    setPlacementPreview(null);
    setSelection({ kind: "tower", id });
  }, []);

  const handleSelectPosition = useCallback((position: { x: number; z: number }) => {
    setPlacementPreview(position);
    setSelection({ kind: "spot", position });
  }, []);

  const handlePreviewPosition = useCallback((position: { x: number; z: number } | null) => {
    setPlacementPreview(position);
  }, []);

  const handleHudSelect = useCallback((next: Selection) => {
    if (next?.kind === "tower") setPlacementPreview(null);
    setSelection(next);
  }, []);

  const handlePause = useCallback(() => {
    setOverlay("pause");
  }, []);
  const [armoryTowerKind, setArmoryTowerKind] = useState<TowerKind>("rifleman");
  const activeStage = getStageById(activeStageId);
  const gameplayStage =
    state.gameMode === "endless" && activeChallenge
      ? createEndlessStage(activeChallenge)
      : state.sideModeId && activeSideMode
        ? activeSideMode.stage
        : activeStage;
  const waveThreatPreview =
    state.wave > 0 ? getWaveThreatPreview(gameplayStage, state.wave) : null;
  const towerRevision = state.towers
    .map((tower) => tower.id + ":" + tower.level + ":" + tower.a + ":" + tower.b)
    .join(",");

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

  const highestCompletedCampaignStage = Math.max(
    0,
    ...STAGE_DEFS.filter((stage) => player.stageProgress[String(stage.id)]?.completed).map((stage) => stage.id),
  );
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

  const startCampaignReplayChallenge = (
    stageId: number,
    challenge: CampaignReplayChallengeDefinition,
  ) => {
    if (!player.stageProgress[String(stageId)]?.completed) return;
    resetGameplayState();
    setActiveStageId(stageId);
    game.startStage({ ...getStageById(stageId), campaignReplayChallenge: challenge });
    setScreen("gameplay");
  };

  const startSideMode = (level: SideModeLevel) => {
    if (highestCompletedCampaignStage < level.unlockStageId - 1) return;
    resetGameplayState();
    setActiveSideMode(level);
    game.startSideMode(level, level.cycle === "event" ? seasonalCycleKey : todayKey);
    setScreen("gameplay");
  };

  const leaveToSideModes = () => {
    resetGameplayState();
    setScreen("side-mode-select");
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

    const coarsePointer =
      window.matchMedia("(pointer: coarse)").matches &&
      window.matchMedia("(hover: none)").matches;
    const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowMemory = memory !== undefined && memory <= 4;
    setLowGraphics(coarsePointer || lowCpu || lowMemory);
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
    if (state.continuedAfterVictory || player.adsRemoved || player.gamesPlayed < 2) return;

    void import("@/game/monetization")
      .then(({ showInterstitial }) =>
        showInterstitial("run-complete", {
          now: Date.now(),
          inCombat: false,
          adsRemoved: player.adsRemoved,
        }),
      )
      .catch(() => false);
  }, [lastReward, player.adsRemoved, player.gamesPlayed, screen, state.gameOver, state.continuedAfterVictory]);

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
    ? state.stageWon ? "TRIAL CLEARED" : "TRIAL FAILED"
    : state.sideModeId
      ? state.stageWon ? "RUN COMPLETE" : "RUN FAILED"
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
      selectTower: (id: number) => void;
      getTowerIds: () => number[];
      getCombatSnapshot: () => { towerCount: number; projectileKinds: TowerKind[]; projectileEmissions: number };
      forceStageVictoryForTest: () => boolean;
      getRunSnapshot: () => { towerCount: number; towerIds: number[]; gold: number; baseHp: number; wave: number; stageWaveTarget: number; gameOver: boolean; stageWon: boolean; endlessMode: boolean; continuedAfterVictory: boolean };
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
      forceStageVictoryForTest: () => {
        const current = game.state;
        if (current.gameOver || current.endlessMode) return false;
        current.wave = current.stageWaveTarget;
        current.spawnQueue = 0;
        current.zombies.length = 0;
        current.waveTimer = 0;
        game.tick(1 / 30);
        return game.state.stageWon;
      },
      getRunSnapshot: () => ({
        towerCount: game.state.towers.length,
        towerIds: game.state.towers.map((tower) => tower.id),
        gold: game.state.gold,
        baseHp: game.state.baseHp,
        wave: game.state.wave,
        stageWaveTarget: game.state.stageWaveTarget,
        gameOver: game.state.gameOver,
        stageWon: game.state.stageWon,
        endlessMode: game.state.endlessMode,
        continuedAfterVictory: game.state.continuedAfterVictory,
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
  const bossTrialClears = player.bossTrialClears[weeklyBossTrial.id] ?? 0;
  const bossTrialMastery = player.bossTrialMastery[weeklyBossTrial.id] ?? 0;
  const seasonalEvent = getSeasonalEvent();
  const seasonalCycleKey = getSeasonalEventCycleKey();
  const seasonalEventEnd = getSeasonalEventEnd();
  const readyEventCount = seasonalEvent.milestones.filter((milestone) => {
    const progress = getSeasonalMilestoneProgress(
      milestone,
      player.seasonalEventProgress,
      player.seasonalEventActivityProgress,
    );
    const unlocked =
      !milestone.prerequisite || player.seasonalEventClaims.includes(milestone.prerequisite);
    return progress >= milestone.target && unlocked && !player.seasonalEventClaims.includes(milestone.id);
  }).length;

  return (
    <div className="rotwood-app fixed inset-0 overflow-hidden bg-sky" data-screen={screen} data-reduced-motion={player.reducedMotion ? "true" : "false"} onPointerDown={() => unlockAudio()}>
      {canvasReady && (
        <Canvas
          frameloop={screen === "gameplay" ? "always" : "never"}
          // Shadows are disabled on touch/low-end hardware; desktop keeps a basic shadow
          // pass with only the base and towers casting, which preserves depth without the
          // cost of animating dozens of zombie/environment shadow casters.
          shadows={lowGraphics ? false : "basic"}
          dpr={lowGraphics ? 0.85 : 1}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
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
            towerRevision={towerRevision}
            onSelectTower={handleSelectTower}
            onSelectPosition={handleSelectPosition}
            onPreviewPosition={handlePreviewPosition}
          />
        </Canvas>
      )}

      {screen === "gameplay" && (
        <>
          <HUD
            state={state}
            selection={selection}
            onSelect={handleHudSelect}
            onPause={handlePause}
            rewardedAvailable={rewardedAvailable}
            waveThreatPreview={waveThreatPreview}
            reducedMotion={player.reducedMotion}
            showMetaSections={false}
            showGameOverOverlay={false}
          />
        </>
      )}

      {screen === "main-menu" && (
        <div className="rotwood-screen rw-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <main className="rw-home mx-auto w-full">
            <header className="rw-home-header">
              <div className="rw-brand-lockup">
                <span className="rw-brand-emblem"><ShieldMark size={25} /></span>
                <div className="min-w-0">
                  <p className="rw-eyebrow">LAST DEFENSE NETWORK</p>
                  <h1 className="rw-brand-title">ROTWOOD <span>DEFENSE</span></h1>
                </div>
              </div>
              <button type="button" onClick={() => openSettings("main-menu")} onPointerDown={() => sfx("uiClick")} aria-label="Open settings" className="rotwood-button rotwood-button-secondary rw-settings-button">
                <Settings2 size={20} />
              </button>
            </header>
            <section className="rw-home-hero" aria-labelledby="rw-home-hero-title">
              <div className="rw-hero-art"><OutbreakIllustration /></div>
              <div className="rw-hero-scrim" aria-hidden="true" />
              <div className="rw-hero-content">
                <p className="rw-eyebrow rw-hero-eyebrow"><span className="rw-live-dot" /> CONTAINMENT ALERT · SECTOR 04</p>
                <h2 id="rw-home-hero-title">THE LAST LIGHT<br /><span>HOLDS.</span></h2>
                <p className="rw-hero-copy">Build your defenses. Hold the line. Survive the night.</p>
                <div className="rw-sector-stamp"><span>RW-04</span><span>THREAT LEVEL: HIGH</span></div>
              </div>
            </section>
            <section className="rw-player-strip" aria-label="Player progress and resources">
              <div className="rw-player-level">
                <span className="rw-level-token"><span>LVL</span>{player.level}</span>
                <div className="rw-level-progress">
                  <div className="rw-level-row"><span>DEFENSE RANK</span><span>{currentLevelXp} / {currentLevelTarget} XP</span></div>
                  <div className="rw-xp-track"><span style={{ width: Math.min(100, (currentLevelXp / Math.max(1, currentLevelTarget)) * 100) + "%" }} /></div>
                </div>
              </div>
              <div className="rw-player-resources">
                <span className="rw-resource-chip"><Coins size={15} /><span>{player.coins.toLocaleString()}</span></span>
                <span className="rw-resource-chip"><Gem size={15} /><span>{player.gems.toLocaleString()}</span></span>
                <span className="rw-resource-chip rw-best-wave"><span className="rw-wave-mark">↗</span><span>{player.highestWave}<small> BEST WAVE</small></span></span>
              </div>
            </section>
            <section className="rw-deploy-panel rotwood-card" aria-label="Recommended defense mission">
              <div className="rw-deploy-heading">
                <div className="min-w-0">
                  <p className="rw-eyebrow">CURRENT DIRECTIVE</p>
                  <h2>STAGE {recommendedStage.stageNumber}</h2>
                  <p className="rw-mission-name">{recommendedStage.name} <span>·</span> {recommendedStage.difficulty}</p>
                </div>
                <div className="rw-mission-stars" aria-label={recommendedStage.stars + " stars earned"}>
                  <span>★</span><strong>{recommendedStage.stars ? "×" + recommendedStage.stars : "NEW"}</strong>
                </div>
              </div>
              <p className="rw-next-unlock">{nextTower ? "NEXT UNLOCK: " + TOWER_INFO[nextTower.kind].name + " · LEVEL " + nextTower.level : "FULL ROSTER · ALL TOWERS UNLOCKED"}</p>
              <ScreenButton className="rw-deploy-button" onClick={() => {
                resetGameplayState();
                setActiveStageId(recommendedStage.id);
                if (isFirstRun) track("menu_quick_play", { stageId: recommendedStage.id });
                game.startStage(recommendedStage);
                setScreen("gameplay");
              }}>
                <span>{isFirstRun ? "DEFEND NOW" : "CONTINUE DEFENSE"}</span><Swords size={19} />
              </ScreenButton>
            </section>
            <section className="rw-home-navigation" aria-labelledby="rw-nav-title">
              <div className="rw-section-heading">
                <div><p className="rw-eyebrow">TACTICAL NETWORK</p><h2 id="rw-nav-title">Command Center</h2></div>
                <span>SELECT DESTINATION</span>
              </div>
              <div className="rw-menu-grid">
                <HomeShortcut title="Operations" subtitle="Campaigns & combat modes" icon={<Swords size={20} />} onClick={() => setScreen("operations")} />
                <HomeShortcut title="Armory" subtitle="Towers & field knowledge" icon={<Wrench size={20} />} onClick={() => setScreen("arsenal")} />
                <HomeShortcut title="Field Intel" subtitle="Missions & achievements" icon={<Trophy size={20} />} {...(readyMissionCount + readyAchievementCount > 0 ? { badge: readyMissionCount + readyAchievementCount } : {})} onClick={() => setScreen("field-intel")} />
                <HomeShortcut title="Supply Depot" subtitle="Daily drops & store" icon={<ShoppingBag size={20} />} onClick={() => setScreen("supply-depot")} />
              </div>
            </section>
            <p className="rw-home-footer"><span>ROTWOOD DEFENSE</span><span>HOLD THE LINE</span></p>
          </main>
        </div>
      )}

      {screen === "operations" && (
        <div className="rw-screen rw-hub-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <main className="rw-hub-wrap mx-auto">
            <ScreenButton className="rw-back-button" variant="secondary" onClick={() => setScreen("main-menu")}>← COMMAND CENTER</ScreenButton>
            <header className="rw-hub-intro"><p className="rw-eyebrow">TACTICAL NETWORK / 01</p><h1>Operations</h1><p>Pick a deployment. Every route leads to a different kind of fight.</p></header>
            <div className="rw-hub-list">
              <MenuTile title="Campaign" subtitle="Structured stages, stars, and tower unlocks." onClick={() => setScreen("stage-select")} />
              <MenuTile title="Endless Siege" subtitle="Push your build as far as it can go." onClick={() => setScreen("endless-select")} />
              <MenuTile title="Boss Trials" subtitle="Take on the weekly boss and its mastery rules." onClick={() => setScreen("boss-trial-select")} />
              <MenuTile title="Side Operations" subtitle="Short resource runs and focused challenges." onClick={() => setScreen("side-mode-select")} />
              <MenuTile title="Live Events" subtitle="Rotating objectives and seasonal milestones." {...(readyEventCount > 0 ? { badge: "READY · " + readyEventCount } : {})} onClick={() => setScreen("events")} />
            </div>
          </main>
        </div>
      )}

      {screen === "arsenal" && (
        <div className="rw-screen rw-hub-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <main className="rw-hub-wrap mx-auto">
            <ScreenButton className="rw-back-button" variant="secondary" onClick={() => setScreen("main-menu")}>← COMMAND CENTER</ScreenButton>
            <header className="rw-hub-intro"><p className="rw-eyebrow">TACTICAL NETWORK / 02</p><h1>Armory</h1><p>Know your tools before the next wave reaches the walls.</p></header>
            <div className="rw-hub-list">
              <MenuTile title="Tower Armory" subtitle="Browse towers, roles, unlocks, and upgrade paths." onClick={() => setScreen("towers")} />
              <MenuTile title="Field Knowledge" subtitle="Spend permanent knowledge on your long-term strategy." onClick={() => setScreen("knowledge")} />
              <MenuTile title="Collection" subtitle="View your earned tower and zombie cosmetics." onClick={() => setScreen("collection")} />
            </div>
            <div className="rw-hub-note"><Sparkles size={18} /><p><strong>Build with intent.</strong><br />Different towers solve different threats. A balanced defense gives you more answers when the horde changes.</p></div>
          </main>
        </div>
      )}

      {screen === "field-intel" && (
        <div className="rw-screen rw-hub-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <main className="rw-hub-wrap mx-auto">
            <ScreenButton className="rw-back-button" variant="secondary" onClick={() => setScreen("main-menu")}>← COMMAND CENTER</ScreenButton>
            <header className="rw-hub-intro"><p className="rw-eyebrow">TACTICAL NETWORK / 03</p><h1>Field Intel</h1><p>Your next objective, recent milestones, and the progress worth chasing.</p></header>
            <div className="rw-hub-list">
              <MenuTile title="Daily Missions" subtitle="Complete field tasks and claim available rewards." {...(readyMissionCount > 0 ? { badge: "READY · " + readyMissionCount } : {})} onClick={() => setScreen("missions")} />
              <MenuTile title="Achievements" subtitle="Track milestones earned across your defenses." {...(readyAchievementCount > 0 ? { badge: "READY · " + readyAchievementCount } : {})} onClick={() => setScreen("achievements")} />
            </div>
          </main>
        </div>
      )}

      {screen === "supply-depot" && (
        <div className="rw-screen rw-hub-screen pointer-events-auto absolute inset-0 z-30 overflow-y-auto p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <main className="rw-hub-wrap mx-auto">
            <ScreenButton className="rw-back-button" variant="secondary" onClick={() => setScreen("main-menu")}>← COMMAND CENTER</ScreenButton>
            <header className="rw-hub-intro"><p className="rw-eyebrow">TACTICAL NETWORK / 04</p><h1>Supply Depot</h1><p>Collect the supplies you have earned. Optional purchases never replace progression earned through play.</p></header>
            <section className="rw-supply-card">
              <div className="rw-supply-icon"><Gift size={21} /></div>
              <div className="rw-supply-copy">
                <p className="rw-eyebrow">DAILY SUPPLY DROP</p><h2>DAY {player.loginCycleDay}/7 · {dailyLoginReward.title}</h2><p>{dailyLoginReward.reward.label}</p>
              </div>
              <button type="button" disabled={!dailyLoginAvailable} onPointerDown={() => sfx("uiClick")} onClick={() => {
                if (!profile.claimDailyLoginReward()) return;
                track("daily_login_claimed", { day: dailyLoginReward.day, reward: dailyLoginReward.reward.label });
              }} className="rotwood-button rotwood-button-primary rw-supply-action">{dailyLoginAvailable ? "CLAIM" : "CLAIMED"}</button>
            </section>
            {!player.adsRemoved && (
              <section className="rw-supply-card rw-bonus-card">
                <div className="rw-supply-icon"><Sparkles size={21} /></div>
                <div className="rw-supply-copy">
                  <p className="rw-eyebrow">VOLUNTARY DAILY BONUS</p><h2>+150 CREDITS · +1 GEM</h2><p>One optional rewarded ad each day.</p>
                </div>
                <button type="button" disabled={!dailyBonusAvailable} onPointerDown={() => sfx("uiClick")} onClick={async () => {
                  const { showRewarded } = await import("@/game/monetization");
                  const earned = await showRewarded("daily-bonus");
                  if (earned && profile.claimDailyRewardedBonus()) track("daily_rewarded_bonus_claimed", { coins: 150, gems: 1 });
                }} className="rotwood-button rotwood-button-secondary rw-supply-action">{dailyBonusAvailable ? "WATCH" : "DONE"}</button>
              </section>
            )}
            <div className="rw-hub-list rw-supply-shop"><MenuTile title="Shop & Optional Extras" subtitle="Cosmetics, support options, and available purchases." onClick={() => setScreen("shop")} /></div>
            <p className="rw-supply-footnote"><Coins size={14} /> Credits and gems earned through play remain central to progression.</p>
          </main>
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
                      <div className="shrink-0 text-right">
                        <span className="rounded-full bg-black/30 px-2 py-1 text-[10px] text-panel-muted">
                          {trial.variants.length} variants
                        </span>
                        <p className="mt-1 text-[9px] uppercase tracking-wider text-accent">
                          Mastery {"★".repeat(bossTrialMastery)}{"☆".repeat(Math.max(0, 3 - bossTrialMastery))}
                        </p>
                        <p className="text-[8px] uppercase tracking-wider text-panel-muted">{bossTrialClears} career clears</p>
                      </div>
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

      {screen === "side-mode-select" && (
        <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-black/65 p-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="mx-auto w-full max-w-md">
            <ScreenButton onClick={() => setScreen("main-menu")} variant="secondary">← BACK</ScreenButton>

            <div className="mt-3 rounded-2xl border border-accent/25 bg-panel/95 p-3 text-panel-foreground shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Repeatable content</p>
              <h2 className="font-display text-2xl tracking-wide">Side Modes</h2>
              <p className="mt-1 text-xs text-panel-muted">
                Short runs for targeted resources and skill challenges. Campaign progression unlocks deeper levels.
              </p>
            </div>

            <section className="mt-3">
              <div className="mb-1.5 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent">RESOURCE OPS</p>
                  <h3 className="font-display text-xl tracking-wide text-panel-foreground">Get what you need</h3>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-panel-muted">3–7 min</p>
              </div>
              <div className="space-y-2">
                {RESOURCE_OPS.map((level) => {
                  const unlocked = highestCompletedCampaignStage >= level.unlockStageId - 1;
                  const clears = player.sideModeClears[level.id] ?? 0;
                  const best = player.sideModeBestScores[level.id] ?? 0;
                  const focusLabel = level.focus === "scrap" ? "CREDITS" : level.focus === "xp" ? "XP" : level.focus === "gems" ? "GEMS" : "BALANCED";
                  return (
                    <div key={level.id} className={"rounded-2xl border bg-panel/95 p-3 shadow-panel " + (unlocked ? "border-white/10" : "border-white/5 opacity-70")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-[0.18em] text-accent">{focusLabel} · LEVEL {level.level}</p>
                          <h4 className="font-display text-lg tracking-wide text-panel-foreground">{level.name}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-panel-muted">{level.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[9px] uppercase tracking-wider text-panel-muted">{level.duration}</p>
                          <p className="mt-1 text-[9px] text-panel-muted">Best {best.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded-full bg-accent/10 px-2 py-1 text-[8px] uppercase tracking-wider text-accent">{level.rewardHint}</span>
                        <span className="rounded-full bg-black/25 px-2 py-1 text-[8px] uppercase tracking-wider text-panel-muted">{clears} CLEARS</span>
                      </div>
                      {unlocked ? (
                        <ScreenButton className="mt-2" onClick={() => startSideMode(level)}>PLAY</ScreenButton>
                      ) : (
                        <div className="mt-2 rounded-xl bg-black/25 px-3 py-2 text-center text-[10px] uppercase tracking-wider text-panel-muted">Unlocks after Campaign Stage {Math.max(1, level.unlockStageId - 1)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-4">
              <div className="mb-1.5 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent">CHALLENGE GAUNTLET</p>
                  <h3 className="font-display text-xl tracking-wide text-panel-foreground">Try something different</h3>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-panel-muted">2–7 min</p>
              </div>
              <div className="space-y-2">
                {CHALLENGE_GAUNTLET.map((level) => {
                  const unlocked = highestCompletedCampaignStage >= level.unlockStageId - 1;
                  const clears = player.sideModeClears[level.id] ?? 0;
                  const best = player.sideModeBestScores[level.id] ?? 0;
                  return (
                    <div key={level.id} className={"rounded-2xl border bg-panel/95 p-3 shadow-panel " + (unlocked ? "border-white/10" : "border-white/5 opacity-70")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-[0.18em] text-accent">GAUNTLET {level.level}</p>
                          <h4 className="font-display text-lg tracking-wide text-panel-foreground">{level.name}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-panel-muted">{level.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[9px] uppercase tracking-wider text-panel-muted">{level.duration}</p>
                          <p className="mt-1 text-[9px] text-panel-muted">Best {best.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-2 rounded-xl bg-black/20 p-2">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-panel-muted">Mastery target</p>
                        <p className="mt-0.5 text-xs text-panel-foreground">{level.masteryHint}</p>
                      </div>
                      {level.allowedTowerKinds ? <p className="mt-1.5 text-[9px] uppercase tracking-wider text-panel-muted">Towers: {level.allowedTowerKinds.join(" · ")}</p> : null}
                      {level.maxTowers !== undefined ? <p className="mt-1 text-[9px] uppercase tracking-wider text-panel-muted">Max towers: {level.maxTowers}</p> : null}
                      {unlocked ? (
                        <ScreenButton className="mt-2" onClick={() => startSideMode(level)}>PLAY</ScreenButton>
                      ) : (
                        <div className="mt-2 rounded-xl bg-black/25 px-3 py-2 text-center text-[10px] uppercase tracking-wider text-panel-muted">Unlocks after Campaign Stage {Math.max(1, level.unlockStageId - 1)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-accent/20 bg-panel/95 p-3 shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent">ENDLESS EXPEDITION</p>
              <h3 className="font-display text-xl tracking-wide text-panel-foreground">Beat your record</h3>
              <p className="mt-1 text-xs text-panel-muted">Survive sectors, choose run powers, and push the next milestone.</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-black/25 p-2 text-center"><p className="font-display text-lg text-panel-foreground">{getEndlessSector(player.endlessBestWave)}</p><p className="text-[8px] uppercase tracking-wider text-panel-muted">Best Sector</p></div>
                <div className="rounded-xl bg-black/25 p-2 text-center"><p className="font-display text-lg text-panel-foreground">{player.endlessBestWave}</p><p className="text-[8px] uppercase tracking-wider text-panel-muted">Best Wave</p></div>
                <div className="rounded-xl bg-black/25 p-2 text-center"><p className="font-display text-lg text-panel-foreground">{player.endlessBestScore.toLocaleString()}</p><p className="text-[8px] uppercase tracking-wider text-panel-muted">Best Score</p></div>
              </div>
              <ScreenButton className="mt-2" onClick={() => setScreen("endless-select")}>ENDLESS EXPEDITION</ScreenButton>
            </section>
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
                  {stage.completed && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedReplayStageId(expandedReplayStageId === stage.id ? null : stage.id)}
                        className="w-full rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-accent"
                      >
                        {expandedReplayStageId === stage.id ? "HIDE CHALLENGES" : `REPLAY CHALLENGES · ${CAMPAIGN_REPLAY_CHALLENGES.filter((challenge) => (player.sideModeClears[campaignReplayProgressKey(stage.id, challenge.id)] ?? 0) > 0).length}/${CAMPAIGN_REPLAY_CHALLENGES.length}`}
                      </button>
                      {expandedReplayStageId === stage.id && (
                        <div className="mt-1.5 space-y-1.5">
                          {CAMPAIGN_REPLAY_CHALLENGES.map((challenge) => {
                            const progressKey = campaignReplayProgressKey(stage.id, challenge.id);
                            const clears = player.sideModeClears[progressKey] ?? 0;
                            const bestScore = player.sideModeBestScores[progressKey] ?? 0;
                            return (
                              <div key={challenge.id} className="flex items-center gap-2 rounded-xl bg-black/25 p-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-display text-sm tracking-wide text-panel-foreground">{challenge.name}</p>
                                  <p className="text-[10px] leading-tight text-panel-muted">{challenge.description}</p>
                                  <p className="mt-0.5 text-[9px] uppercase tracking-wider text-panel-muted">
                                    {clears > 0 ? `${clears} clears · best ${bestScore.toLocaleString()}` : `Reward: ${challenge.reward.coins} credits`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => startCampaignReplayChallenge(stage.id, challenge)}
                                  className="rotwood-button rotwood-button-primary min-h-9 shrink-0 px-3 text-[10px]"
                                >
                                  PLAY
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                          <button type="button" disabled={!unlocked} onClick={() => profile.equipTowerCosmetic(targetKind, cosmetic.id)} className="mt-2 min-h-11 w-full rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40">
                            {equipped ? "Equipped" : "Equip"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="mt-4 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <p className="text-xs uppercase tracking-[0.2em] text-panel-muted">Enemy collection</p>
              <h3 className="font-display text-xl tracking-wide text-panel-foreground">Zombie Skins</h3>
              <p className="mt-1 text-[10px] text-panel-muted">Earn alternate infected palettes through kills, boss defeats, and Endless milestones.</p>
              <div className="mt-2 space-y-2">
                {ZOMBIE_COSMETICS.map((cosmetic) => {
                  const unlocked = cosmetic.unlock(player);
                  const equipped = profile.equippedZombieCosmetic() === cosmetic.id;
                  return (
                    <div key={cosmetic.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg border border-white/10" style={{ background: cosmetic.skin }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base text-panel-foreground">{cosmetic.name}</p>
                          <p className="text-[10px] text-panel-muted">{cosmetic.description}</p>
                          <p className="mt-1 text-[9px] text-panel-muted">{unlocked ? "Unlocked" : cosmetic.requirement}</p>
                        </div>
                      </div>
                      <button type="button" disabled={!unlocked} onClick={() => profile.equipZombieCosmetic(cosmetic.id)} className="mt-2 min-h-10 w-full rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-40">
                        {equipped ? "Equipped" : "Equip"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
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
             <div className="mt-3 rounded-2xl border border-accent/25 bg-panel/95 p-3 shadow-panel">
               <p className="text-[9px] uppercase tracking-[0.18em] text-accent">PLAY THE EVENT</p>
               <p className="mt-1 text-xs text-panel-muted">Turn event progress into a short themed defense instead of only collecting milestone kills.</p>
               {getSeasonalEventRun(seasonalEvent.id) ? (
                 <ScreenButton
                   className="mt-2"
                   onClick={() => {
                     const eventRun = getSeasonalEventRun(seasonalEvent.id);
                     if (eventRun) startSideMode(eventRun);
                   }}
                 >
                   PLAY EVENT RUN
                 </ScreenButton>
               ) : null}
             </div>
            <div className="mt-3 space-y-2">
              {seasonalEvent.milestones.map((milestone) => {
                const progress = getSeasonalMilestoneProgress(
                  milestone,
                  player.seasonalEventProgress,
                  player.seasonalEventActivityProgress,
                );
                const claimed = player.seasonalEventClaims.includes(milestone.id);
                const locked =
                  Boolean(milestone.prerequisite) &&
                  !player.seasonalEventClaims.includes(milestone.prerequisite!);
                const pct = Math.min(1, progress / milestone.target);
                return (
                  <div key={milestone.id} className="rounded-2xl bg-panel/95 p-3 shadow-panel">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg tracking-wide text-panel-foreground">{milestone.title}</p>
                        <p className="text-xs text-panel-muted">{milestone.description}</p>
                        <p className="text-[10px] text-panel-muted">
                          {progress.toLocaleString()} / {milestone.target.toLocaleString()} {milestone.activity.replace("-", " ")}
                        </p>
                      </div>
                      <p className="text-xs text-accent">{milestone.reward.label}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/35">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: pct * 100 + "%" }} />
                    </div>
                    <ScreenButton onClick={() => profile.claimSeasonalMilestone(milestone.id)} variant={claimed ? "secondary" : "primary"} disabled={locked || claimed || progress < milestone.target}>
                      {claimed ? "CLAIMED" : locked ? "COMPLETE PREVIOUS STEP" : progress >= milestone.target ? "CLAIM REWARD" : "KEEP DEFENDING"}
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
                    <div className="mt-2 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.12em]">
                      <span className={unlocked ? "text-accent" : "text-panel-muted"}>
                        {unlocked ? "AVAILABLE" : "UNLOCKS LEVEL " + info.unlockLevel}
                      </span>
                      <span className="text-panel-muted">Mastery {profile.towerMasteryLevel(kind)}/10</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl bg-panel/95 p-3 shadow-panel">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Tower overview</p>
              <h3 className="font-display text-xl tracking-wide text-panel-foreground">{TOWER_INFO[armoryTowerKind].name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-panel-muted">{TOWER_INFO[armoryTowerKind].blurb}</p>
              <div className="mt-3 rounded-xl border border-accent/15 bg-accent/5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-panel-muted">Tower mastery</span>
                  <span className="font-display text-xs text-accent">{profile.towerMasteryLevel(armoryTowerKind)}/10</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-accent" style={{ width: Math.min(100, (profile.towerMasteryProgress(armoryTowerKind).current / Math.max(1, profile.towerMasteryProgress(armoryTowerKind).target)) * 100) + "%" }} />
                </div>
                <p className="mt-1 text-[9px] text-panel-muted">
                  {profile.towerMasteryLevel(armoryTowerKind) >= 10 ? "Mastered · cosmetics are fully unlocked." : "Upgrade this tower in battle to earn mastery and cosmetic milestones."}
                </p>
              </div>
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
              <div className="mb-3 rounded-xl border border-accent/15 bg-accent/5 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Today</p>
                <p className="font-display text-lg text-panel-foreground">Daily missions</p>
                <div className="mt-2 space-y-1.5">
                  {DAILY_MISSION_DEFS.map((mission) => {
                    const progress = player.dailyMissionProgress[mission.id];
                    const completed = Boolean(progress?.completed);
                    const claimed = Boolean(progress?.claimed);
                    return (
                      <div key={mission.id} className="rounded-lg bg-black/20 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-panel-foreground">{mission.description}</p>
                            <p className="text-[9px] text-panel-muted">{Math.min(mission.target, progress?.progress ?? 0)}/{mission.target} · {mission.reward.label}</p>
                          </div>
                          <button type="button" disabled={!completed || claimed} onClick={() => profile.claimDailyMission(mission.id)} className="min-h-9 shrink-0 rounded-md bg-accent px-2 py-1 text-[9px] font-extrabold text-accent-foreground disabled:opacity-40">
                            {claimed ? "CLAIMED" : completed ? "CLAIM" : "TRACKING"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 p-3">
          <ScreenCard>
            <h2 className={"text-center font-display text-3xl tracking-wide " + (state.stageWon ? "text-accent" : state.endlessMode ? "text-accent" : "text-danger")}>{resultLabel}</h2>
            {state.bossTrial && activeBossTrial
              ? <p className="mt-1 text-center text-sm text-panel-muted">{activeBossTrial.bossName} · {activeBossTrial.title}</p>
              : state.endlessMode && activeChallenge
                ? <p className="mt-1 text-center text-sm text-panel-muted">{activeChallenge.name}</p>
                : activeSideMode
                  ? <p className="mt-1 text-center text-sm text-panel-muted">{activeSideMode.name} · {activeSideMode.category === "resource" ? "Resource Ops" : activeSideMode.category === "challenge" ? "Challenge Gauntlet" : "Seasonal Event"}</p>
                  : <p className="mt-1 text-center text-xs text-panel-muted">{state.stageWon ? "Defense held. Your rewards are ready." : "The horde broke through. Try again or change your approach."}</p>}
            {lastReward && !state.continuedAfterVictory ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">+{lastReward.coins}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">Credits</p></div>
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">+{lastReward.xp}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">XP</p></div>
                <div className="rounded-2xl bg-black/30 p-3 text-center"><p className="font-display text-xl text-panel-foreground">{"★".repeat(lastReward.starsEarned ?? 0) || "—"}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">Stars</p></div>
              </div>
            ) : null}
            {state.continuedAfterVictory ? (
              <p className="mt-3 rounded-xl bg-black/25 px-3 py-2 text-center text-xs text-panel-muted">
                Endless record saved. No extra player XP or repeat campaign rewards are granted.
              </p>
            ) : null}
            <div className="mt-3 rounded-2xl bg-black/25 p-3 text-center">
              {state.endlessMode || state.bossTrial || state.sideModeId ? (
                <><p className="text-[9px] uppercase tracking-[0.18em] text-panel-muted">{state.bossTrial ? "Trial score" : state.sideModeId ? "Mode score" : "Score"}</p><p className="mt-1 font-display text-2xl text-panel-foreground">{state.bossTrial ? state.bossTrialScore.toLocaleString() : lastReward?.score !== undefined ? lastReward.score.toLocaleString() : "—"}</p></>
              ) : (
                <><p className="text-[9px] uppercase tracking-[0.18em] text-panel-muted">Wave reached</p><p className="mt-1 font-display text-2xl text-panel-foreground">{state.wave}</p></>
              )}
              {lastReward?.newRecord ? <p className="mt-1 font-display text-sm tracking-wide text-accent">NEW RECORD</p> : null}
            </div>
            {lastReward && lastReward.leveledTo !== null ? (
              <p className="mt-3 rounded-xl bg-accent px-3 py-2 text-center font-display text-lg tracking-wide text-accent-foreground">LEVEL UP · {lastReward.leveledTo}</p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {([["Best streak", state.maxKillStreak], ["Bosses", state.bossesDefeated], ["Perfect waves", state.perfectWaves]] as const).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/25 py-2"><p className="font-display text-lg text-panel-foreground">{value}</p><p className="text-[9px] uppercase tracking-wider text-panel-muted">{label}</p></div>
              ))}
            </div>
            {state.activeRunModifiers.length > 0 ? (
              <p className="mt-2 text-center text-[10px] leading-tight text-panel-muted">Build: {state.activeRunModifiers.map((id) => RUN_MODIFIER_DEFS.find((entry) => entry.id === id)?.name ?? id).join(" · ")}</p>
            ) : null}
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
            {nextTower ? (
              <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Next unlock</p>
                    <p className="font-display text-lg text-panel-foreground">{TOWER_INFO[nextTower.kind].name}</p>
                    <p className="text-[10px] text-panel-muted">{towerUnlockRole(nextTower.kind)}</p>
                  </div>
                  <p className="text-right font-display text-sm text-panel-foreground">LEVEL {nextTower.level}<span className="block text-[9px] text-panel-muted">Keep defending</span></p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/5 p-3 text-center">
                <p className="font-display text-lg text-accent">FULL ROSTER</p>
                <p className="text-[10px] text-panel-muted">All towers unlocked. Chase mastery and cosmetics next.</p>
              </div>
            )}
            {state.stageWon && !activeSideMode && !state.endlessMode && !state.bossTrial ? (() => {
              const suggested = CAMPAIGN_REPLAY_CHALLENGES.find((challenge) => !((player.sideModeClears[campaignReplayProgressKey(activeStageId, challenge.id)] ?? 0) > 0));
              return suggested ? (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/15 bg-accent/5 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Replay challenge</p>
                    <p className="font-display text-base text-panel-foreground">{suggested.name}</p>
                    <p className="text-[10px] leading-tight text-panel-muted">{suggested.description} · +{suggested.firstClearBonus.coins + suggested.reward.coins} credits first clear</p>
                  </div>
                  <button type="button" onClick={() => startCampaignReplayChallenge(activeStageId, suggested)} className="rotwood-button rotwood-button-primary min-h-9 shrink-0 px-3 text-[10px]">TRY</button>
                </div>
              ) : null;
            })() : null}
            {!state.stageWon && !state.reviveUsed && state.baseHp <= 0 && rewardedAvailable ? (
              <ScreenButton onClick={async () => { const { showRewarded } = await import("@/game/monetization"); const earned = await showRewarded("revive"); if (earned && game.reviveRun()) setScreen("gameplay"); }} variant="secondary">SECOND CHANCE · WATCH AD</ScreenButton>
            ) : null}
            {lastReward && !state.continuedAfterVictory && !player.adsRemoved && rewardedAvailable && profile.canClaimLastRunRewardBoost ? (
              <ScreenButton onClick={async () => { const { showRewarded } = await import("@/game/monetization"); const earned = await showRewarded("double-run-rewards"); if (earned) profile.claimLastRunRewardBoost(); }} variant="secondary">DOUBLE REWARDS · WATCH AD</ScreenButton>
            ) : null}
            {game.canContinueAfterVictory() ? (
              <div className="mt-3 rounded-2xl border border-accent/25 bg-accent/10 p-3">
                <p className="font-display text-base tracking-wide text-accent">YOUR DEFENSE CAN GO FURTHER</p>
                <p className="mt-1 text-xs leading-relaxed text-panel-muted">
                  Keep your current towers, upgrades, scrap, and base health. Endless waves grow tougher over time; continuing grants no additional player-level XP.
                </p>
                <ScreenButton onClick={() => {
                  if (!game.continueAfterVictory()) return;
                  profile.clearReward();
                  setSelection(null);
                  setOverlay(null);
                  setScreen("gameplay");
                }}>CONTINUE IN ENDLESS</ScreenButton>
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {state.stageWon && nextStage ? <ScreenButton onClick={() => startStage(nextStage.id)}>NEXT STAGE</ScreenButton>
                : activeSideMode ? <ScreenButton onClick={() => { resetGameplayState(); game.startSideMode(activeSideMode, activeSideMode.cycle === "event" ? seasonalCycleKey : todayKey); setScreen("gameplay"); }}>RETRY RUN</ScreenButton>
                : state.stageWon ? <ScreenButton onClick={leaveToStageSelect}>CAMPAIGN</ScreenButton>
                : state.bossTrial && activeBossTrial ? <ScreenButton onClick={() => { resetGameplayState(); game.startBossTrial(activeBossTrial, weekKey); setScreen("gameplay"); }}>RETRY TRIAL</ScreenButton>
                : state.endlessMode && activeChallenge ? <ScreenButton onClick={() => { resetGameplayState(); game.startEndless(activeChallenge, activeChallenge.period === "weekly" ? weekKey : todayKey); setScreen("gameplay"); }}>RETRY</ScreenButton>
                : <ScreenButton onClick={() => startStage(activeStageId)}>RETRY</ScreenButton>}
              {state.stageWon && !activeSideMode ? <ScreenButton onClick={() => startStage(activeStageId)} variant="secondary">REPLAY</ScreenButton> : null}
              <ScreenButton onClick={() => state.sideModeId ? setScreen("side-mode-select") : state.bossTrial ? setScreen("boss-trial-select") : state.endlessMode ? setScreen("endless-select") : setScreen("stage-select")} variant="secondary">{state.sideModeId ? "SIDE MODES" : state.bossTrial ? "BOSS TRIALS" : state.endlessMode ? "ENDLESS" : "CAMPAIGN"}</ScreenButton>
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
              {state.endlessMode ? (
                <ScreenButton onClick={() => {
                  if (game.endEndlessRun()) setOverlay(null);
                }} variant="secondary">END ENDLESS RUN</ScreenButton>
              ) : null}
              <ScreenButton onClick={() => setOverlay("confirm-restart")} variant="secondary">
                RESTART
              </ScreenButton>
              <ScreenButton onClick={state.sideModeId ? leaveToSideModes : leaveToStageSelect} variant="secondary">
                {state.sideModeId ? "SIDE MODES" : "STAGE SELECT"}
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
