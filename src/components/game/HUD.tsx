import { useState } from "react";
import {
  MAX_TOWER_LEVEL,
  TOWER_INFO,
  TOWER_KINDS,
  TOWER_PATHS,
  canBuyTier,
  game,
  incomeCost,
  incomePerSecond,
  tierCost,
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
import { isMuted, setMuted, unlockAudio } from "@/game/audio";
import { profile, xpForLevel } from "@/game/profile";
import type { Selection } from "./Scene";

function ProgressionBar() {
  const p = profile.profile;
  const need = xpForLevel(p.level);
  const pct = Math.min(100, (p.xp / need) * 100);
  return (
    <div className="rounded-xl bg-panel/85 px-3 py-1.5 shadow-panel backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-sm tracking-wide text-panel-foreground">
          Lv {p.level}
        </span>
        <span className="text-[10px] tabular-nums text-panel-muted">
          {p.xp} / {need} XP · {need - p.xp} to next
        </span>
        <span className="flex gap-2 text-[11px] tabular-nums text-panel-foreground">
          <span>🪙 {p.coins}</span>
          <span>💎 {p.gems}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const KINDS: TowerKind[] = TOWER_KINDS;

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
    <div className="flex flex-col items-center rounded-xl bg-panel/85 px-3 py-1.5 shadow-panel backdrop-blur">
      <span
        className="font-display text-lg leading-none tracking-wide text-panel-foreground data-[tone=danger]:text-danger"
        data-tone={tone}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-panel-muted">{label}</span>
    </div>
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
}: {
  state: GameState;
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const [muted, setMutedState] = useState(isMuted());
  const tower =
    selection?.kind === "tower" ? (state.towers.find((t) => t.id === selection.id) ?? null) : null;
  const spot = selection?.kind === "spot" ? selection.index : null;
  const incCost = incomeCost(state.incomeLevel);
  const player = profile.profile;
  const levelCost = tower ? towerUpgradeCost(tower) : Infinity;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Stat label="Gold" value={`${Math.floor(state.gold)}`} tone="gold" />
          <Stat label="Wave" value={`${state.wave || 1}`} />
          <Stat
            label="Base"
            value={`${state.baseHp}/${state.baseMaxHp}`}
            tone={state.baseHp <= 6 ? "danger" : undefined}
          />
          <Stat label="Kills" value={`${state.kills}`} />
          <button
            onClick={() => {
              unlockAudio();
              const v = !muted;
              setMuted(v);
              setMutedState(v);
            }}
            className="pointer-events-auto rounded-xl bg-panel/85 px-3 py-2 font-display text-sm text-panel-foreground shadow-panel backdrop-blur"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
        <ProgressionBar />
      </div>

      <div className="pointer-events-auto max-h-[58vh] space-y-2 overflow-y-auto pr-1">
        {!tower && spot === null && state.towers.length === 0 && (
          <div className="rounded-2xl bg-panel/90 p-3 text-center shadow-panel backdrop-blur">
            <p className="font-display text-lg tracking-wide text-panel-foreground">
              Tap a glowing pad to build a tower
            </p>
            <p className="text-[11px] text-panel-muted">
              The horde arrives shortly — you start with no defences.
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
                const can = unlocked && state.gold >= info.cost;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      if (game.build(spot, k)) onSelect(null);
                    }}
                    disabled={!can}
                    className="rounded-xl border border-white/10 bg-black/25 px-2 py-3 text-left transition active:scale-[0.98] disabled:opacity-40"
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
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-panel-muted">
              Locked towers unlock automatically as your profile level rises.
            </p>
          </div>
        )}

        {state.towers.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {state.towers.map((t) => {
              const info = TOWER_INFO[t.kind];
              const active = t.id === (selection?.kind === "tower" ? selection.id : -1);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect({ kind: "tower", id: t.id })}
                  className="rounded-xl border border-white/10 bg-panel/85 px-1 py-1.5 text-center shadow-panel backdrop-blur transition data-[active=true]:border-accent data-[active=true]:bg-panel"
                  data-active={active}
                >
                  <span
                    className="mx-auto mb-1 block h-2 w-2 rounded-full"
                    style={{ backgroundColor: info.accent }}
                  />
                  <span className="block font-display text-xs tracking-wide text-panel-foreground">
                    {info.name}
                  </span>
                  <span className="block text-[10px] text-panel-muted">
                    Lv {t.level} · {t.a}/{t.b}
                  </span>
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
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => game.upgradeIncome()}
            disabled={state.gold < incCost}
            className="flex-1 rounded-xl bg-panel/85 px-3 py-2 text-xs font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Income +{incomePerSecond(state.incomeLevel + 1) - incomePerSecond(state.incomeLevel)}/s
            <span className="block text-[10px] text-panel-muted">{incCost} gold</span>
          </button>
          <button
            onClick={() => game.repair()}
            disabled={state.gold < 30 || state.baseHp >= state.baseMaxHp}
            className="flex-1 rounded-xl bg-panel/85 px-3 py-2 text-xs font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Repair base +5
            <span className="block text-[10px] text-panel-muted">30 gold</span>
          </button>
        </div>
      </div>

      {state.gameOver && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 backdrop-blur">
          <h2 className="font-display text-5xl tracking-wide text-danger">Overrun</h2>
          <p className="text-sm text-panel-muted">
            You survived {state.wave} waves and dropped {state.kills} zombies.
          </p>
          {profile.lastReward && (
            <div className="w-full max-w-xs rounded-2xl bg-panel/90 p-3 text-center shadow-panel">
              {profile.lastReward.leveledTo !== null && (
                <p className="mb-2 rounded-lg bg-accent px-3 py-1.5 font-display text-lg tracking-wide text-accent-foreground">
                  Level up! You reached level {profile.lastReward.leveledTo}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["XP", `+${profile.lastReward.xp}`],
                  ["Coins", `+${profile.lastReward.coins}`],
                  ["Gems", `+${profile.lastReward.gems}`],
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
                {profile.lastReward.newRecord ? "New best wave! · " : ""}
                Best wave {profile.profile.highestWave} · {profile.profile.gamesPlayed} runs ·{" "}
                {profile.profile.totalKills} total kills
              </p>
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
