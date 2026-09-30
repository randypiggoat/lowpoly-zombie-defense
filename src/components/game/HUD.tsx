import { useEffect, useState, useSyncExternalStore } from "react";
import {
  TOWER_INFO,
  TOWER_KINDS,
  TOWER_PATHS,
  canBuyTier,
  game,
  incomeCost,
  tierCost,
  towerSellValue,
  towerUnlocked,
  towerBuildCost,
  type GameState,
  type Tower,
  type TowerKind,
} from "@/game/engine";
import {
  ACHIEVEMENT_DEFS,
  DAILY_LOGIN_REWARDS,
  DAILY_MISSION_DEFS,
  dateKey,
  profile,
  type AchievementProgress,
  type PlayerProfile,
} from "@/game/profile";
import type { Selection } from "./Scene";
import { isKillStreakMilestone, killStreakGoldMultiplier } from "@/game/combatRewards";
import { sfx } from "@/game/audio";
import { track } from "@/game/analytics";
import { getFirstSessionTip } from "@/game/firstSessionGuide";
import type { WaveThreatPreview } from "@/game/waveThreatPreview";
import { getBaseDangerLevel } from "@/game/baseDanger";

import { getBossHealthSummary } from "@/game/bossHealth";
import { FIELD_KNOWLEDGE, knowledgeUnlocked } from "@/game/fieldKnowledge";

function useProfileSnapshot() {
  useSyncExternalStore(
    (cb) => profile.subscribe(cb),
    () => profile.snapshot,
    () => 0,
  );
  return {
    player: profile.profile,
    lastReward: profile.lastReward,
    levelUpNotice: profile.levelUpNotice,
  };
}

const KINDS: TowerKind[] = TOWER_KINDS;

function nextProgressionTarget(player: PlayerProfile) {
  const nextKnowledge = FIELD_KNOWLEDGE.find(
    (node) => player.fieldKnowledge[node.id] !== 1 && knowledgeUnlocked(node, player.fieldKnowledge),
  );
  if (nextKnowledge) {
    const affordable = player.coins >= nextKnowledge.cost;
    return {
      label: nextKnowledge.name,
      detail: affordable ? "Ready · " + nextKnowledge.cost + " credits" : (nextKnowledge.cost - player.coins) + " credits to Field Knowledge",
    };
  }
  return { label: "Field Knowledge complete", detail: "Every permanent knowledge node unlocked" };
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold" | "danger" | undefined;
}) {
  return (
    <div className="rotwood-stat flex min-w-[4.2rem] flex-col items-center rounded-lg bg-panel/85 px-2 py-1 shadow-panel backdrop-blur">
      <span
        className="rotwood-stat-number font-display text-lg leading-none tracking-wide text-panel-foreground data-[tone=danger]:text-danger"
        data-tone={tone}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.16em] text-panel-muted">{label}</span>
    </div>
  );
}

function progressPercent(progress: AchievementProgress | undefined, target: number) {
  const current = progress?.progress ?? 0;
  return Math.min(100, (current / Math.max(1, target)) * 100);
}

function ProgressTrack({
  progress,
  target,
}: {
  progress: AchievementProgress | undefined;
  target: number;
}) {
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-[10px] text-panel-muted">
        <span>Progress</span>
        <span className="tabular-nums">
          {Math.min(target, progress?.progress ?? 0)} / {target}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${progressPercent(progress, target)}%` }}
        />
      </div>
    </div>
  );
}

function ClaimButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rotwood-hud-button rounded-lg bg-accent px-3 py-2 text-xs font-extrabold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function abilityLabel(ability: string | undefined) {
  switch (ability) {
    case "burst": return "BURST";
    case "stun": return "STUN";
    case "mark": return "MARK";
    case "shatter": return "SHATTER";
    case "execute": return "EXECUTE";
    case "boss-hunter": return "ELITE HUNTER";
    case "close-range": return "POINT BLANK";
    case "burn-duration": return "LONG BURN";
    default: return "";
  }
}

function PathColumn({ tower, path, scrap }: { tower: Tower; path: "a" | "b"; scrap: number }) {
  const def = TOWER_PATHS[tower.kind][path];
  const owned = path === "a" ? tower.a : tower.b;
  const locked = !canBuyTier(tower, path);
  const cost = tierCost(tower, path);
  const next = owned < 4 ? def.tiers[owned]! : null;

  return (
    <section className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-2">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xs tracking-[0.12em] text-panel-foreground">{def.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-panel-muted">{def.focus}</p>
        </div>
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-panel-muted">
          {owned === 4 ? "MAXED" : locked ? "LOCKED" : "UP NEXT"}
        </span>
      </div>
      <div className="space-y-1.5">
        {def.tiers.map((tier, index) => {
          const purchased = index < owned;
          const isNext = index === owned && Boolean(next);
          const ability = abilityLabel(tier.ability);
          return (
            <div
              key={tier.name}
              data-upgrade-state={purchased ? "owned" : isNext && !locked ? "next" : "future"}
              className={
                "rounded-lg border px-2 py-1.5 " +
                (purchased
                  ? "border-accent/20 bg-accent/5"
                  : isNext && !locked
                    ? "border-accent/45 bg-accent/10"
                    : "border-white/5 bg-black/15")
              }
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black " +
                    (purchased
                      ? "bg-accent text-accent-foreground"
                      : isNext && !locked
                        ? "border border-accent/50 text-accent"
                        : "border border-white/10 text-panel-muted")
                  }
                >
                  {purchased ? "✓" : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[11px] tracking-wide text-panel-foreground">{tier.name}</p>
                    {ability ? <span className="shrink-0 rounded-full bg-accent/10 px-1 py-0.5 text-[7px] font-black tracking-[0.12em] text-accent">{ability}</span> : null}
                  </div>
                  {purchased || isNext ? (
                    <p className="mt-0.5 text-[9px] leading-tight text-panel-muted">{tier.desc}</p>
                  ) : (
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-panel-muted/70">Unlock later</p>
                  )}
                  {isNext && !locked ? (
                    <button
                      type="button"
                      onClick={() => game.buyTier(tower.id, path)}
                      disabled={scrap < cost}
                      aria-label={"Buy " + tier.name}
                      className="mt-1.5 min-h-9 w-full rounded-md bg-accent px-2 py-1 font-display text-[10px] tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                    >
                      {cost} SCRAP
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export function HUD({
  state,
  selection,
  onSelect,
  onPause,
  rewardedAvailable = false,
  waveThreatPreview = null,
  reducedMotion = false,
  showMetaSections = false,
  showGameOverOverlay = true,
}: {
  state: GameState;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onPause?: () => void;
  rewardedAvailable?: boolean;
  waveThreatPreview?: WaveThreatPreview | null;
  reducedMotion?: boolean;
  showMetaSections?: boolean;
  showGameOverOverlay?: boolean;
}) {
  const { player, lastReward, levelUpNotice } = useProfileSnapshot();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const tower =
    selection?.kind === "tower" ? (state.towers.find((t) => t.id === selection.id) ?? null) : null;
  const spot = selection?.kind === "spot" ? selection.position : null;
  const placement = spot ? game.getPlacementStatus(spot.x, spot.z) : null;
  const incCost = incomeCost(state.incomeLevel);
  const nextTarget = nextProgressionTarget(player);
  const today = dateKey();
  const claimedLoginToday = player.lastLoginClaimDate === today;
  const enemiesRemaining = state.spawnQueue + state.zombies.filter((z) => !z.dead).length;
  const bossHealth = getBossHealthSummary(state.zombies);
  const firstSessionTip = getFirstSessionTip(
    player.gamesPlayed,
    state.wave,
    state.towers.length,
    state.towers.filter((tower) => tower.level > 1).length,
  );
  const baseDanger = getBaseDangerLevel(state.baseHp, state.baseMaxHp);

  useEffect(() => {
    if (!levelUpNotice) return;
    setActiveLevel(levelUpNotice.level);
    const timeout = window.setTimeout(() => setActiveLevel(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [levelUpNotice]);

  useEffect(() => {
    if (state.killStreak > 0 && isKillStreakMilestone(state.killStreak)) {
      sfx("streak");
    }
  }, [state.killStreak]);

  useEffect(() => {
    profile.refreshRetentionState();
    const interval = window.setInterval(() => profile.refreshRetentionState(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rotwood-hud pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-[max(0.6rem,env(safe-area-inset-top))]">
      {baseDanger === "critical" && !reducedMotion && !state.gameOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse border-[10px] border-danger/25"
        />
      )}
      {state.runModifierOffer.length > 0 && (
        <div className="rotwood-modal pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <div className="rotwood-shell w-full max-w-md p-4">
            <p className="text-center text-[10px] uppercase tracking-[0.24em] text-accent">Wave {state.wave} reward</p>
            <h2 className="mt-1 text-center font-display text-3xl tracking-wide text-panel-foreground">Choose Your Power</h2>
            <p className="mt-1 text-center text-xs text-panel-muted">This choice lasts for the rest of the run.</p>
            <div className="mt-4 space-y-2">
              {state.runModifierOffer.map((modifier) => (
                <button
                  key={modifier.id}
                  type="button"
                  onClick={() => game.chooseRunModifier(modifier.id)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-left transition active:scale-[0.98] hover:border-accent/50"
                >
                  <p className="font-display text-lg tracking-wide text-panel-foreground">{modifier.name}</p>
                  <p className="mt-0.5 text-xs text-panel-muted">{modifier.description}</p>
                </button>
              ))}
            </div>
            {!state.runModifierRerollUsed && rewardedAvailable && (
              <button
                type="button"
                onClick={async () => {
                  const { showRewarded } = await import("@/game/monetization");
                  const earned = await showRewarded("modifier-reroll");
                  if (earned) game.rerollRunModifierOffer();
                }}
                className="mt-2 min-h-10 w-full rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 font-display text-sm tracking-wide text-accent transition active:scale-[0.98]"
              >
                REROLL ONCE · WATCH AD
              </button>
            )}
          </div>
        </div>
      )}
      {state.killStreak >= 3 && state.killStreakTimer > 0 && !state.gameOver && (
        <div className="rotwood-toast pointer-events-none absolute left-1/2 top-[26%] -translate-x-1/2 rounded-2xl bg-black/55 px-4 py-2 text-center shadow-panel backdrop-blur">
          <p className="font-display text-xl tracking-[0.12em] text-accent">{state.killStreak} KILL STREAK</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-panel-muted">
            +{Math.round((killStreakGoldMultiplier(state.killStreak) - 1) * 100)}% SCRAP · KEEP IT GOING
          </p>
        </div>
      )}
      {activeLevel !== null && !state.gameOver && (
        <div className="rotwood-toast absolute left-1/2 top-4 -translate-x-1/2 rounded-xl bg-accent px-4 py-2 text-center shadow-panel">
          <p className="font-display text-lg tracking-wide text-accent-foreground">Level up!</p>
          <p className="text-xs text-accent-foreground/90">Player level {activeLevel}</p>
        </div>
      )}
      
            {state.waveMessage && !state.gameOver && (
        <div
          className="rotwood-wave-message pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 text-center"
          style={{
            opacity: Math.min(1, state.waveMessageLife),
          }}
        >
          <div
            className={`font-display font-black tracking-[0.12em] drop-shadow-[0_3px_0_rgba(0,0,0,0.9)] ${
              state.waveMessageType === "boss"
                ? "text-4xl text-danger"
                : state.waveMessageType === "complete"
                  ? "text-3xl text-accent"
                  : "text-3xl text-white"
            }`}
          >
            {state.waveMessage}
          </div>
        </div>
      )}

      {waveThreatPreview &&
        !state.gameOver &&
        (state.waveMessageType === "start" || state.waveMessageType === "boss") && (
          <div className="pointer-events-none absolute left-1/2 top-[23%] -translate-x-1/2 rounded-xl border border-white/10 bg-panel/75 px-3 py-1.5 text-center shadow-panel backdrop-blur">
            <p className="text-[9px] uppercase tracking-[0.2em] text-panel-muted">
              {waveThreatPreview.boss ? "BOSS THREAT" : "THREATS THIS WAVE"}
            </p>
            <p className="mt-0.5 font-display text-xs tracking-wide text-panel-foreground">
              {waveThreatPreview.threats.join(" · ")}
            </p>
          </div>
        )}

      {bossHealth && !state.gameOver && (
        <div className="pointer-events-none absolute left-1/2 top-[30%] w-[min(88vw,24rem)] -translate-x-1/2 rounded-xl border border-accent/30 bg-black/60 px-3 py-2 text-center shadow-panel backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-xs tracking-[0.16em] text-accent">
              {bossHealth.count > 1 ? `BOSS x${bossHealth.count}` : "BOSS"}
            </p>
            <p className="text-[9px] tabular-nums text-panel-muted">
              {Math.ceil(bossHealth.currentHp).toLocaleString()} / {Math.ceil(bossHealth.maxHp).toLocaleString()}
            </p>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${bossHealth.ratio * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <Stat label="Scrap" value={`${Math.floor(state.gold)}`} tone="gold" />
          <Stat label="Wave" value={`${state.wave || 1}`} />
          <Stat
            label="Base"
            value={`${state.baseHp}/${state.baseMaxHp}`}
            tone={baseDanger === "safe" ? undefined : "danger"}
          />
          <div className="pointer-events-auto ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                const nextSpeed = state.simulationSpeed === 1 ? 2 : 1;
                game.setSimulationSpeed(nextSpeed);
                track("simulation_speed_changed", { speed: nextSpeed });
              }}
              aria-label={state.simulationSpeed === 1 ? "Speed up gameplay" : "Return to normal speed"}
              className="min-h-10 rounded-xl bg-panel/90 px-3 py-2 font-display text-sm tracking-wide text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.97]"
            >
              {state.simulationSpeed}×
            </button>
            <button
              onClick={() => onPause?.()}
              className="min-h-10 rounded-xl bg-panel/90 px-3 py-2 font-display text-sm tracking-wide text-panel-foreground shadow-panel backdrop-blur"
            >
              Pause
            </button>
          </div>
        </div>
        <div className="pointer-events-none inline-flex w-fit items-center gap-2 rounded-lg bg-panel/75 px-2.5 py-1 text-[10px] tracking-wide text-panel-muted shadow-panel backdrop-blur">
          <span>Lv {player.level}</span>
          <span>Enemies {enemiesRemaining}</span>
        </div>
        {firstSessionTip && (
          <div className="pointer-events-none max-w-sm rounded-xl border border-accent/20 bg-panel/80 px-3 py-2 shadow-panel backdrop-blur">
            <p className="font-display text-xs tracking-wide text-accent">{firstSessionTip.title}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-panel-muted">{firstSessionTip.body}</p>
          </div>
        )}
      </div>

      <div className="pointer-events-auto max-h-[56dvh] space-y-1.5 overflow-y-auto overscroll-contain pr-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showMetaSections && (
          <>
            <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-panel-foreground">
                    Daily Login Reward
                  </h2>
                  <p className="text-[11px] text-panel-muted">
                    7-day cycle · missing a day does not reset your main progression
                  </p>
                </div>
                <ClaimButton
                  onClick={() => profile.claimDailyLoginReward()}
                  disabled={claimedLoginToday}
                >
                  {claimedLoginToday ? "Claimed today" : `Claim Day ${player.loginCycleDay}`}
                </ClaimButton>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {DAILY_LOGIN_REWARDS.map((reward) => {
                  const claimed =
                    claimedLoginToday && player.lastLoginRewardDayClaimed === reward.day;
                  const active = !claimedLoginToday && player.loginCycleDay === reward.day;
                  return (
                    <div
                      key={reward.day}
                      className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center"
                      data-active={active}
                    >
                      <p className="font-display text-xs tracking-wide text-panel-foreground">
                        Day {reward.day}
                      </p>
                      <p className="mt-0.5 text-[10px] text-panel-muted">{reward.title}</p>
                      <p className="mt-1 text-[10px] leading-tight text-panel-foreground">
                        {reward.reward.label}
                      </p>
                      <p className="mt-1 text-[10px] text-accent">
                        {claimed ? "Claimed" : active ? "Ready" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-panel-foreground">
                    Daily Missions
                  </h2>
                  <p className="text-[11px] text-panel-muted">
                    3 missions · progress saves and resets daily
                  </p>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {DAILY_MISSION_DEFS.map((mission) => {
                  const progress = player.dailyMissionProgress[mission.id];
                  return (
                    <div key={mission.id} className="rounded-xl bg-black/25 p-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-sm tracking-wide text-panel-foreground">
                            {mission.description}
                          </p>
                          <p className="text-[11px] text-panel-muted">
                            Reward · {mission.reward.label}
                          </p>
                        </div>
                        <ClaimButton
                          onClick={() => profile.claimDailyMission(mission.id)}
                          disabled={!progress?.completed || Boolean(progress?.claimed)}
                        >
                          {progress?.claimed
                            ? "Claimed"
                            : progress?.completed
                              ? "Claim"
                              : "In progress"}
                        </ClaimButton>
                      </div>
                      <ProgressTrack progress={progress} target={mission.target} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
              <div>
                <h2 className="font-display text-lg tracking-wide text-panel-foreground">
                  Achievements
                </h2>
                <p className="text-[11px] text-panel-muted">
                  Data-driven milestones with persistent rewards
                </p>
              </div>
              <div className="mt-2 space-y-2">
                {ACHIEVEMENT_DEFS.map((achievement) => {
                  const progress = player.achievements[achievement.id];
                  return (
                    <div key={achievement.id} className="rounded-xl bg-black/25 p-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-sm tracking-wide text-panel-foreground">
                            {achievement.title}
                          </p>
                          <p className="text-[11px] text-panel-muted">{achievement.description}</p>
                          <p className="mt-1 text-[11px] text-panel-foreground">
                            Reward · {achievement.reward.label}
                          </p>
                        </div>
                        <ClaimButton
                          onClick={() => profile.claimAchievement(achievement.id)}
                          disabled={!progress?.completed || Boolean(progress?.claimed)}
                        >
                          {progress?.claimed ? "Claimed" : progress?.completed ? "Claim" : "Locked"}
                        </ClaimButton>
                      </div>
                      <ProgressTrack progress={progress} target={achievement.target} />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!tower && spot === null && state.towers.length === 0 && (
          <div className="rounded-xl bg-panel/85 px-3 py-2 text-center shadow-panel backdrop-blur">
            <p className="font-display text-sm tracking-wide text-panel-foreground">
              Tap open ground to place a tower
            </p>
          </div>
        )}

        {spot !== null && (
          <div className="rounded-xl bg-panel/95 p-2 shadow-panel backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="truncate font-display text-base tracking-wide text-panel-foreground">
                Build a tower
              </h2>
              <button
                onClick={() => onSelect(null)}
                aria-label="Close tower menu"
                className="h-7 w-7 shrink-0 rounded-md bg-black/25 text-sm text-panel-muted"
              >
                ×
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
              <span className="text-[9px] uppercase tracking-[0.16em] text-panel-muted">
                Placement target
              </span>
              <span className={placement?.valid ? "font-display text-xs tracking-wide text-accent" : "font-display text-xs tracking-wide text-danger"}>
                {placement?.valid
                  ? "LEGAL PLACEMENT"
                  : placement?.reason === "road"
                    ? "TOO CLOSE TO ROAD"
                    : placement?.reason === "obstacle"
                      ? "BLOCKED TERRAIN"
                      : placement?.reason === "too-close"
                        ? "TOO CLOSE"
                        : "OUT OF BOUNDS"}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {KINDS.map((k) => {
                const info = TOWER_INFO[k];
                const unlocked = towerUnlocked(k, player.level, player.unlockedTowers);
                const buildCost = towerBuildCost(k);
                const canBuild = unlocked && state.gold >= buildCost && Boolean(placement?.valid);
                return (
                  <div
                    key={k}
                    className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-1.5 text-left"
                  >
                    <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: info.accent }}
                        />
                        <span className="truncate font-display text-xs tracking-wide text-panel-foreground">
                          {info.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-[9px] text-panel-muted">
                        {unlocked ? `${buildCost} scrap` : `Lv ${info.unlockLevel}`}
                      </span>
                    </span>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-panel-muted">{info.blurb}</p>
                    <button
                      onClick={() => {
                        if (game.buildAt(spot.x, spot.z, k)) onSelect(null);
                      }}
                      disabled={!canBuild}
                      className="mt-1.5 min-h-9 w-full rounded-md bg-accent px-1.5 py-1 font-display text-xs tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                    >
                      {unlocked
                        ? `Build · ${buildCost} scrap`
                        : `Unlocks Lv ${info.unlockLevel}`}
                    </button>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state.towers.length > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {state.towers.map((t) => {
              const info = TOWER_INFO[t.kind];
              const active = t.id === (selection?.kind === "tower" ? selection.id : -1);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect({ kind: "tower", id: t.id })}
                  className="rounded-lg border border-white/10 bg-panel/85 px-1 py-1 text-center shadow-panel backdrop-blur transition data-[active=true]:border-accent data-[active=true]:bg-panel"
                  data-active={active}
                >
                  <span
                    className="mx-auto mb-0.5 block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: info.accent }}
                  />
                  <span className="block font-display text-[10px] tracking-wide text-panel-foreground">
                    {info.name}
                  </span>
                  <span className="block text-[9px] text-panel-muted">Lv {t.level}</span>
                </button>
              );
            })}
          </div>
        )}

        {tower && (
          <div className="rounded-xl bg-panel/95 p-2 shadow-panel backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
              <h2 className="truncate font-display text-lg tracking-wide text-panel-foreground">
                {TOWER_INFO[tower.kind].name}{" "}
                <span className="text-panel-muted">Lv {tower.level}</span>
              </h2>
              <button
                onClick={() => {
                  game.sell(tower.id);
                  onSelect(null);
                }}
                className="shrink-0 rounded-md bg-black/25 px-2 py-1 text-[10px] text-panel-muted"
              >
                Sell · {towerSellValue(tower)} scrap
              </button>
              <button
                onClick={() => onSelect(null)}
                aria-label="Close tower details"
                className="h-7 w-7 shrink-0 rounded-md bg-black/25 text-sm text-panel-muted"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-panel-muted">{TOWER_INFO[tower.kind].blurb}</p>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PathColumn tower={tower} path="a" scrap={state.gold} />
              <PathColumn tower={tower} path="b" scrap={state.gold} />
            </div>
            
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={() => game.upgradeIncome()}
            disabled={state.gold < incCost}
            className="flex-1 rounded-lg bg-panel/85 px-2.5 py-2 text-[11px] font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Upgrade salvage income
            <span className="block text-[10px] text-panel-muted">{incCost} SCRAP</span>
          </button>
          <button
            onClick={() => game.repair()}
            disabled={state.gold < 30 || state.baseHp >= state.baseMaxHp}
            className="flex-1 rounded-lg bg-panel/85 px-2.5 py-2 text-[11px] font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Repair base
            <span className="block text-[10px] text-panel-muted">30 scrap</span>
          </button>
        </div>
      </div>

      {showGameOverOverlay && state.gameOver && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 backdrop-blur">
          <h2 className="font-display text-5xl tracking-wide text-danger">Overrun</h2>
          <p className="text-sm text-panel-muted">
            Wave reached {state.wave} · Zombies killed {state.kills}
          </p>
          {lastReward && (
            <div className="w-full max-w-xs rounded-2xl bg-panel/90 p-3 text-center shadow-panel">
              {lastReward.leveledTo !== null && (
                <p className="mb-2 rounded-lg bg-accent px-3 py-1.5 font-display text-lg tracking-wide text-accent-foreground">
                  Level up! You reached level {lastReward.leveledTo}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["XP", `+${lastReward.xp}`],
                  ["Credits", `+${lastReward.coins}`],
                  ["Gems", `+${lastReward.gems}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-black/25 py-1.5">
                    <div className="font-display text-base text-panel-foreground">{value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-panel-muted">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-panel-muted">
                {lastReward.newRecord ? "New best wave! · " : ""}
                Best wave {player.highestWave} · {player.gamesPlayed} runs · {player.totalKills}{" "}
                total kills
              </p>
              <div className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-left">
                <p className="text-[10px] uppercase tracking-[0.16em] text-panel-muted">
                  Next target
                </p>
                <p className="font-display text-sm tracking-wide text-panel-foreground">
                  {nextTarget.label}
                </p>
                <p className="text-[11px] text-panel-muted">{nextTarget.detail}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              profile.clearReward();
              game.reset();
              onSelect(null);
            }}
            className="rounded-xl bg-accent px-8 py-3 font-display text-xl tracking-wide text-accent-foreground"
          >
            Defend again
          </button>
        </div>
      )}
    </div>
  );
}
