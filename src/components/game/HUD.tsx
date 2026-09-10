import { useEffect, useState, useSyncExternalStore } from "react";
import {
  MAX_PROFILE_TOWER_UPGRADE,
  MAX_TOWER_LEVEL,
  TOWER_INFO,
  TOWER_KINDS,
  TOWER_PATHS,
  canBuyTier,
  game,
  incomeCost,
  incomePerSecond,
  tierCost,
  towerProfileBonus,
  towerProfileUpgradeCost,
  towerProfileUpgradeLevel,
  towerBurn,
  towerChain,
  towerCrit,
  towerDamage,
  towerRange,
  towerRate,
  towerSellValue,
  towerSlow,
  towerSplash,
  towerUnlocked,
  towerUpgradeCost,
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
  xpForLevel,
  type AchievementProgress,
  type PlayerProfile,
} from "@/game/profile";
import type { Selection } from "./Scene";

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
  const nextTower = KINDS.find((kind) => !towerUnlocked(kind, player.level, player.unlockedTowers));
  if (nextTower) {
    const info = TOWER_INFO[nextTower];
    const xpLeft = Math.max(0, xpForLevel(player.level) - player.xp);
    if (player.level < info.unlockLevel) {
      return {
        label: `${info.name} unlock`,
        detail:
          info.coinUnlock > 0
            ? `Reach Lv ${info.unlockLevel} or save ${info.coinUnlock} coins · ${xpLeft} XP to next level`
            : `Reach Lv ${info.unlockLevel} · ${xpLeft} XP to next level`,
      };
    }
    return {
      label: `${info.name} early unlock`,
      detail: `${Math.max(0, info.coinUnlock - player.coins)} more coins needed`,
    };
  }

  const towerToUpgrade = [...KINDS].sort((a, b) => {
    const byLevel = towerProfileUpgradeLevel(a) - towerProfileUpgradeLevel(b);
    return byLevel !== 0 ? byLevel : towerProfileUpgradeCost(a) - towerProfileUpgradeCost(b);
  })[0];

  if (towerToUpgrade && towerProfileUpgradeLevel(towerToUpgrade) < MAX_PROFILE_TOWER_UPGRADE) {
    return {
      label: `${TOWER_INFO[towerToUpgrade].name} mastery`,
      detail: `Upgrade to Lv ${towerProfileUpgradeLevel(towerToUpgrade) + 1} for ${towerProfileUpgradeCost(towerToUpgrade)} coins`,
    };
  }

  return {
    label: `Player level ${player.level + 1}`,
    detail: `${Math.max(0, xpForLevel(player.level) - player.xp)} XP to next level`,
  };
}

function towerSpecialSummary(tower: Tower) {
  const parts: string[] = [];
  if (towerSplash(tower) > 0) {
    parts.push(
      `${tower.kind === "flamethrower" ? "Cone" : "Blast"} ${towerSplash(tower).toFixed(1)}`,
    );
  }
  if (towerChain(tower) > 0) parts.push(`Chains ${towerChain(tower)}`);
  if (towerBurn(tower) > 0) parts.push(`${towerBurn(tower).toFixed(0)}/s burn`);
  if (towerSlow(tower) > 0) parts.push(`${Math.round(towerSlow(tower) * 100)}% slow`);
  if (towerCrit(tower) > 0) parts.push(`${Math.round(towerCrit(tower) * 100)}% crit`);
  return parts.join(" · ") || "Single-target fire";
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
    <div className="flex min-w-[4.2rem] flex-col items-center rounded-lg bg-panel/85 px-2 py-1 shadow-panel backdrop-blur">
      <span
        className="font-display text-base leading-none tracking-wide text-panel-foreground data-[tone=danger]:text-danger"
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
      className="rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PathColumn({ tower, path, gold }: { tower: Tower; path: "a" | "b"; gold: number }) {
  const def = TOWER_PATHS[tower.kind][path];
  const owned = path === "a" ? tower.a : tower.b;
  const locked = !canBuyTier(tower, path);
  const cost = tierCost(tower, path);
  const next = owned < 4 ? def.tiers[owned]! : null;
  const affordable = !!next && !locked && gold >= cost;

  return (
    <div className="flex-1 rounded-xl bg-black/25 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm tracking-wide text-panel-foreground">{def.name}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 w-3 rounded-full"
              style={{
                backgroundColor:
                  i < owned ? TOWER_INFO[tower.kind].accent : "rgba(255,255,255,0.16)",
              }}
            />
          ))}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-panel-muted">{def.focus}</p>
      {next ? (
        <>
          <p className="mt-1.5 text-[11px] leading-tight text-panel-foreground">
            <span className="font-semibold">{next.name}</span>
            <span className="block text-panel-muted">{next.desc}</span>
          </p>
          <button
            onClick={() => game.buyTier(tower.id, path)}
            disabled={!affordable}
            className="mt-2 w-full rounded-lg bg-accent px-2 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
          >
            {locked ? "Path locked" : `${cost} gold`}
          </button>
        </>
      ) : (
        <p className="mt-3 text-center font-display text-sm text-accent">Path maxed</p>
      )}
    </div>
  );
}

export function HUD({
  state,
  selection,
  onSelect,
  onPause,
  showMetaSections = false,
  showGameOverOverlay = true,
}: {
  state: GameState;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onPause?: () => void;
  showMetaSections?: boolean;
  showGameOverOverlay?: boolean;
}) {
  const { player, lastReward, levelUpNotice } = useProfileSnapshot();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const tower =
    selection?.kind === "tower" ? (state.towers.find((t) => t.id === selection.id) ?? null) : null;
  const spot = selection?.kind === "spot" ? selection.index : null;
  const incCost = incomeCost(state.incomeLevel);
  const levelCost = tower ? towerUpgradeCost(tower) : Infinity;
  const towerMetaLevel = tower ? towerProfileUpgradeLevel(tower.kind) : 0;
  const towerMetaCost = tower ? towerProfileUpgradeCost(tower.kind) : Infinity;
  const towerMetaBonus = tower ? towerProfileBonus(tower.kind) : null;
  const nextTarget = nextProgressionTarget(player);
  const today = dateKey();
  const claimedLoginToday = player.lastLoginClaimDate === today;
  const enemiesRemaining = state.spawnQueue + state.zombies.filter((z) => !z.dead).length;

  useEffect(() => {
    if (!levelUpNotice) return;
    setActiveLevel(levelUpNotice.level);
    const timeout = window.setTimeout(() => setActiveLevel(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [levelUpNotice]);

  useEffect(() => {
    profile.refreshRetentionState();
    const interval = window.setInterval(() => profile.refreshRetentionState(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-[max(0.6rem,env(safe-area-inset-top))]">
      {activeLevel !== null && !state.gameOver && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl bg-accent px-4 py-2 text-center shadow-panel">
          <p className="font-display text-lg tracking-wide text-accent-foreground">Level up!</p>
          <p className="text-xs text-accent-foreground/90">Player level {activeLevel}</p>
        </div>
      )}
      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <Stat label="Coins" value={`${Math.floor(state.gold)}`} tone="gold" />
          <Stat label="Wave" value={`${state.wave || 1}`} />
          <Stat
            label="Base"
            value={`${state.baseHp}/${state.baseMaxHp}`}
            tone={state.baseHp <= 6 ? "danger" : undefined}
          />
          <button
            onClick={() => onPause?.()}
            className="pointer-events-auto ml-auto min-h-10 rounded-xl bg-panel/90 px-3 py-2 font-display text-sm tracking-wide text-panel-foreground shadow-panel backdrop-blur"
          >
            Pause
          </button>
        </div>
        <div className="pointer-events-none inline-flex w-fit items-center gap-2 rounded-lg bg-panel/75 px-2.5 py-1 text-[10px] tracking-wide text-panel-muted shadow-panel backdrop-blur">
          <span>Lv {player.level}</span>
          <span>Enemies {enemiesRemaining}</span>
        </div>
      </div>

      <div className="pointer-events-auto max-h-[44vh] space-y-1.5 overflow-y-auto overscroll-contain pr-1 pb-1">>
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
              Tap a glowing pad to build
            </p>
          </div>
        )}

        {spot !== null && (
          <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
            <h2 className="font-display text-lg tracking-wide text-panel-foreground">
              Build a tower
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {KINDS.map((k) => {
                const info = TOWER_INFO[k];
                const unlocked = towerUnlocked(k, player.level, player.unlockedTowers);
                const canBuild = unlocked && state.gold >= info.cost;
                const unlockAffordable =
                  !unlocked && info.coinUnlock > 0 && player.coins >= info.coinUnlock;
                return (
                  <div
                    key={k}
                    className="rounded-xl border border-white/10 bg-black/25 px-2 py-3 text-left"
                  >
                    <span className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="block h-3 w-3 rounded-full"
                          style={{ backgroundColor: info.accent }}
                        />
                        <span className="font-display text-sm tracking-wide text-panel-foreground">
                          {info.name}
                        </span>
                      </span>
                      <span className="text-[10px] text-panel-muted">
                        {unlocked ? `${info.cost}g` : `Lv ${info.unlockLevel}`}
                      </span>
                    </span>
                    <span className="block text-[11px] leading-tight text-panel-foreground">
                      {info.blurb}
                    </span>
                    <span className="mt-1 block text-[10px] text-panel-muted">
                      DMG {info.damage} · SPD {info.rate.toFixed(1)}/s · RNG {info.range.toFixed(1)}
                    </span>
                    <button
                      onClick={() => {
                        if (game.build(spot, k)) onSelect(null);
                      }}
                      disabled={!canBuild}
                      className="mt-2 w-full rounded-lg bg-accent px-2 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                    >
                      {unlocked
                        ? `Build · ${info.cost} gold`
                        : `Locked until Lv ${info.unlockLevel}`}
                    </button>
                    {!unlocked && info.coinUnlock > 0 && (
                      <button
                        onClick={() => game.unlockTower(k)}
                        disabled={!unlockAffordable}
                        className="mt-1.5 w-full rounded-lg bg-black/30 px-2 py-2 text-[11px] font-semibold text-panel-foreground transition active:scale-[0.98] disabled:opacity-40"
                      >
                        Unlock early · {info.coinUnlock} coins
                      </button>
                    )}
                    {unlocked && (
                      <p className="mt-1.5 text-[10px] text-panel-muted">
                        Workshop Lv {towerProfileUpgradeLevel(k)} · coins upgrade this tower family
                        permanently
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-panel-muted">
              Locked towers unlock automatically as your profile level rises, or early with coins.
            </p>
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
          <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl tracking-wide text-panel-foreground">
                {TOWER_INFO[tower.kind].name}{" "}
                <span className="text-panel-muted">Lv {tower.level}</span>
              </h2>
              <button
                onClick={() => {
                  game.sell(tower.id);
                  onSelect(null);
                }}
                className="rounded-lg bg-black/25 px-2 py-1 text-[11px] text-panel-muted"
              >
                Sell · {towerSellValue(tower)}g
              </button>
            </div>
            <p className="mt-1 text-sm text-panel-foreground">{TOWER_INFO[tower.kind].blurb}</p>
            <p className="mt-1 text-[11px] text-panel-muted">{towerSpecialSummary(tower)}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-center sm:grid-cols-4">
              {[
                ["Damage", towerDamage(tower).toFixed(0)],
                ["Rate", `${towerRate(tower).toFixed(1)}/s`],
                ["Range", towerRange(tower).toFixed(1)],
                [
                  towerSlow(tower) > 0 ? "Slow" : "Crit",
                  towerSlow(tower) > 0
                    ? `${Math.round(towerSlow(tower) * 100)}%`
                    : `${Math.round(towerCrit(tower) * 100)}%`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-black/20 py-1">
                  <div className="font-display text-base text-panel-foreground">{value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-panel-muted">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => game.upgradeTower(tower.id)}
              disabled={tower.level >= MAX_TOWER_LEVEL || state.gold < levelCost}
              className="mt-2 w-full rounded-xl bg-accent px-3 py-2 font-display text-base tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
            >
              {tower.level >= MAX_TOWER_LEVEL
                ? "Level maxed"
                : `Upgrade to Lv ${tower.level + 1} · ${levelCost}g`}
            </button>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <PathColumn tower={tower} path="a" gold={state.gold} />
              <PathColumn tower={tower} path="b" gold={state.gold} />
            </div>
            <p className="mt-1.5 text-center text-[10px] text-panel-muted">
              Flat levels boost damage, range, and fire rate. Only one path can go past tier 2.
            </p>
            <div className="mt-2 rounded-xl bg-black/25 p-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-display text-sm tracking-wide text-panel-foreground">
                    Workshop Lv {towerMetaLevel}
                  </p>
                  {towerMetaBonus && (
                    <p className="text-[10px] text-panel-muted">
                      Permanent +{Math.round((towerMetaBonus.damage - 1) * 100)}% DMG · +
                      {Math.round((towerMetaBonus.rate - 1) * 100)}% SPD · +
                      {Math.round((towerMetaBonus.range - 1) * 100)}% RNG
                    </p>
                  )}
                </div>
                <button
                  onClick={() => game.buyProfileTowerUpgrade(tower.kind)}
                  disabled={!Number.isFinite(towerMetaCost) || player.coins < towerMetaCost}
                  className="rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
                >
                  {towerMetaLevel >= MAX_PROFILE_TOWER_UPGRADE
                    ? "Mastery maxed"
                    : `${towerMetaCost} coins`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={() => game.upgradeIncome()}
            disabled={state.gold < incCost}
            className="flex-1 rounded-lg bg-panel/85 px-2.5 py-2 text-[11px] font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Income +{incomePerSecond(state.incomeLevel + 1) - incomePerSecond(state.incomeLevel)}/s
            <span className="block text-[10px] text-panel-muted">{incCost}g</span>
          </button>
          <button
            onClick={() => game.repair()}
            disabled={state.gold < 30 || state.baseHp >= state.baseMaxHp}
            className="flex-1 rounded-lg bg-panel/85 px-2.5 py-2 text-[11px] font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Repair base +5
            <span className="block text-[10px] text-panel-muted">30g</span>
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
                  ["Coins", `+${lastReward.coins}`],
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
