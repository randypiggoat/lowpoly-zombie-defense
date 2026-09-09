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

function towerAbilitySummary(tower: Tower) {
  const parts: string[] = [];
  const splash = towerSplash(tower);
  const chain = towerChain(tower);
  const burn = towerBurn(tower);
  const slow = towerSlow(tower);
  const crit = towerCrit(tower);

  if (splash > 0) parts.push(`${splash.toFixed(1)} splash`);
  if (chain > 0) parts.push(`${chain + 1} targets`);
  if (burn > 0) parts.push(`${burn.toFixed(0)}/s burn`);
  if (slow > 0) parts.push(`${Math.round(slow * 100)}% slow`);
  if (crit > 0) parts.push(`${Math.round(crit * 100)}% crit`);

  return parts.length > 0 ? parts.join(" · ") : TOWER_INFO[tower.kind].special;
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
            className="mt-2 min-h-10 w-full rounded-lg bg-accent px-2 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
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
  const player = profile.profile;
  const tower =
    selection?.kind === "tower" ? (state.towers.find((t) => t.id === selection.id) ?? null) : null;
  const spot = selection?.kind === "spot" ? selection.index : null;
  const incCost = incomeCost(state.incomeLevel);
  const nextTowerLevelCost = tower ? towerUpgradeCost(tower) : Infinity;
  const towerInfo = tower ? TOWER_INFO[tower.kind] : null;

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

      <div className="pointer-events-auto space-y-2">
        {!tower && spot === null && state.towers.length === 0 && (
          <div className="rounded-2xl bg-panel/90 p-3 text-center shadow-panel backdrop-blur">
            <p className="font-display text-lg tracking-wide text-panel-foreground">
              Tap a glowing pad to build a tower
            </p>
            <p className="text-[11px] text-panel-muted">
              Start with cheap towers, then scale into crowd control and late-game damage.
            </p>
          </div>
        )}

        {spot !== null && (
          <div className="max-h-[54vh] overflow-y-auto rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg tracking-wide text-panel-foreground">
                  Build a tower
                </h2>
                <p className="text-[11px] text-panel-muted">
                  Choose from the existing roster. Locked towers unlock through player progression.
                </p>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="rounded-lg bg-black/25 px-3 py-2 text-[11px] text-panel-muted"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TOWER_KINDS.map((kind) => {
                const info = TOWER_INFO[kind];
                const unlocked = towerUnlocked(kind, player.level, player.unlockedTowers);
                const canAfford = state.gold >= info.cost;
                const disabled = !unlocked || !canAfford;
                return (
                  <button
                    key={kind}
                    onClick={() => {
                      if (game.build(spot, kind)) onSelect(null);
                    }}
                    disabled={disabled}
                    className="min-h-32 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-left transition active:scale-[0.98] disabled:opacity-55"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className="mb-1 block h-2.5 w-8 rounded-full"
                          style={{ backgroundColor: info.accent }}
                        />
                        <span className="block font-display text-sm tracking-wide text-panel-foreground">
                          {info.name}
                        </span>
                      </div>
                      <span className="rounded-full bg-black/25 px-2 py-1 text-[10px] uppercase tracking-wider text-panel-muted">
                        {info.cost}g
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-panel-muted">
                      {info.description}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-panel-foreground">
                      {info.damage} dmg · {info.rate.toFixed(1)}/s · {info.range.toFixed(1)} range
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-panel-muted">
                      {info.special}
                    </p>
                    <p className="mt-2 text-[10px] text-panel-muted">
                      {!unlocked
                        ? `Unlocks at level ${info.unlockLevel}`
                        : !canAfford
                          ? `Need ${info.cost - Math.floor(state.gold)} more gold`
                          : `Up to level ${info.maxUpgradeLevel} · upgrades start at ${info.upgradeBase} gold`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state.towers.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {state.towers.map((t) => {
              const info = TOWER_INFO[t.kind];
              const active = t.id === (selection?.kind === "tower" ? selection.id : -1);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect({ kind: "tower", id: t.id })}
                  className="rounded-xl border border-white/10 bg-panel/85 px-2 py-2 text-center shadow-panel backdrop-blur transition data-[active=true]:border-accent data-[active=true]:bg-panel"
                  data-active={active}
                >
                  <span
                    className="mx-auto mb-1 block h-2.5 w-8 rounded-full"
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
          <div className="max-h-[56vh] overflow-y-auto rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl tracking-wide text-panel-foreground">
                  {TOWER_INFO[tower.kind].name}
                </h2>
                <p className="text-[11px] text-panel-muted">
                  Level {tower.level}/{towerInfo?.maxUpgradeLevel ?? MAX_TOWER_LEVEL} · Paths{" "}
                  {tower.a}/{tower.b}
                </p>
              </div>
              <button
                onClick={() => {
                  game.sell(tower.id);
                  onSelect(null);
                }}
                className="rounded-lg bg-black/25 px-3 py-2 text-[11px] text-panel-muted"
              >
                Sell · {towerSellValue(tower)}g
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-tight text-panel-muted">
              {TOWER_INFO[tower.kind].description}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-panel-foreground">
              {towerAbilitySummary(tower)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-center sm:grid-cols-5">
              {[
                ["Damage", towerDamage(tower).toFixed(0)],
                ["DPS", (towerDamage(tower) * towerRate(tower)).toFixed(0)],
                ["Rate", `${towerRate(tower).toFixed(1)}/s`],
                ["Range", towerRange(tower).toFixed(1)],
                [
                  "Upgrade",
                  tower.level >= (towerInfo?.maxUpgradeLevel ?? MAX_TOWER_LEVEL)
                    ? "Max"
                    : `${nextTowerLevelCost}g`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-black/20 py-1.5">
                  <div className="font-display text-base text-panel-foreground">{value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-panel-muted">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => game.upgradeTower(tower.id)}
              disabled={
                tower.level >= (towerInfo?.maxUpgradeLevel ?? MAX_TOWER_LEVEL) ||
                state.gold < nextTowerLevelCost
              }
              className="mt-2 min-h-11 w-full rounded-xl bg-accent px-3 py-2 font-display text-sm tracking-wide text-accent-foreground transition active:scale-[0.98] disabled:opacity-40"
            >
              {tower.level >= (towerInfo?.maxUpgradeLevel ?? MAX_TOWER_LEVEL)
                ? "Tower level maxed"
                : `Upgrade to level ${tower.level + 1} · ${nextTowerLevelCost} gold`}
            </button>
            <div className="mt-2 flex gap-1.5">
              <PathColumn tower={tower} path="a" gold={state.gold} />
              <PathColumn tower={tower} path="b" gold={state.gold} />
            </div>
            <p className="mt-1.5 text-center text-[10px] text-panel-muted">
              Only one path can go past tier 2, and every upgrade changes real combat stats.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => game.upgradeIncome()}
            disabled={state.gold < incCost}
            className="flex-1 rounded-xl bg-panel/85 px-3 py-3 text-xs font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
          >
            Income +{incomePerSecond(state.incomeLevel + 1) - incomePerSecond(state.incomeLevel)}/s
            <span className="block text-[10px] text-panel-muted">{incCost} gold</span>
          </button>
          <button
            onClick={() => game.repair()}
            disabled={state.gold < 30 || state.baseHp >= state.baseMaxHp}
            className="flex-1 rounded-xl bg-panel/85 px-3 py-3 text-xs font-semibold text-panel-foreground shadow-panel backdrop-blur transition active:scale-[0.98] disabled:opacity-40"
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
