import {
  TOWER_INFO,
  game,
  incomeCost,
  incomePerSecond,
  towerDamage,
  towerRate,
  upgradeCost,
  type GameState,
} from "@/game/engine";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gold" | "danger" | undefined }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-panel/85 px-3 py-1.5 shadow-panel backdrop-blur">
      <span className="font-display text-lg leading-none tracking-wide text-panel-foreground data-[tone=danger]:text-danger" data-tone={tone}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-panel-muted">{label}</span>
    </div>
  );
}

export function HUD({
  state,
  selected,
  onSelect,
}: {
  state: GameState;
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const tower = state.towers.find((t) => t.id === selected) ?? null;
  const cost = tower ? upgradeCost(tower) : 0;
  const canUpgrade = tower ? state.gold >= cost : false;
  const incCost = incomeCost(state.incomeLevel);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      {/* top */}
      <div className="flex items-start justify-between gap-2">
        <Stat label="Gold" value={`${Math.floor(state.gold)}`} tone="gold" />
        <Stat label="Wave" value={`${state.wave || 1}`} />
        <Stat
          label="Base"
          value={`${state.baseHp}/${state.baseMaxHp}`}
          tone={state.baseHp <= 6 ? "danger" : undefined}
        />
        <Stat label="Kills" value={`${state.kills}`} />
      </div>

      {/* bottom panel */}
      <div className="pointer-events-auto space-y-2">
        <div className="flex gap-1.5">
          {state.towers.map((t) => {
            const info = TOWER_INFO[t.kind];
            const active = t.id === selected;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="flex-1 rounded-xl border border-white/10 bg-panel/85 px-1 py-2 text-center shadow-panel backdrop-blur transition data-[active=true]:border-accent data-[active=true]:bg-panel"
                data-active={active}
              >
                <span
                  className="mx-auto mb-1 block h-2 w-2 rounded-full"
                  style={{ backgroundColor: info.accent }}
                />
                <span className="block font-display text-xs tracking-wide text-panel-foreground">
                  {info.name}
                </span>
                <span className="block text-[10px] text-panel-muted">Lv {t.level}</span>
              </button>
            );
          })}
        </div>

        {tower && (
          <div className="rounded-2xl bg-panel/90 p-3 shadow-panel backdrop-blur">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl tracking-wide text-panel-foreground">
                {TOWER_INFO[tower.kind].name}{" "}
                <span className="text-panel-muted">Lv {tower.level}</span>
              </h2>
              <span className="text-[11px] text-panel-muted">{TOWER_INFO[tower.kind].blurb}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/20 py-1">
                <div className="font-display text-base text-panel-foreground">
                  {towerDamage(tower).toFixed(0)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-panel-muted">Damage</div>
              </div>
              <div className="rounded-lg bg-black/20 py-1">
                <div className="font-display text-base text-panel-foreground">
                  {towerRate(tower).toFixed(1)}/s
                </div>
                <div className="text-[10px] uppercase tracking-wider text-panel-muted">Rate</div>
              </div>
              <div className="rounded-lg bg-black/20 py-1">
                <div className="font-display text-base text-panel-foreground">
                  +{(towerDamage(tower) * 0.55).toFixed(0)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-panel-muted">Next dmg</div>
              </div>
            </div>
            <button
              onClick={() => game.upgrade(tower.id)}
              disabled={!canUpgrade}
              className="mt-3 w-full rounded-xl bg-accent px-4 py-3 font-display text-lg tracking-wide text-accent-foreground shadow-panel transition active:scale-[0.98] disabled:opacity-40"
            >
              Upgrade · {cost} gold
            </button>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => game.upgradeIncome()}
                disabled={state.gold < incCost}
                className="flex-1 rounded-xl bg-black/25 px-3 py-2 text-xs font-semibold text-panel-foreground transition active:scale-[0.98] disabled:opacity-40"
              >
                Income +{incomePerSecond(state.incomeLevel + 1) - incomePerSecond(state.incomeLevel)}/s
                <span className="block text-[10px] text-panel-muted">{incCost} gold</span>
              </button>
              <button
                onClick={() => game.repair()}
                disabled={state.gold < 30 || state.baseHp >= state.baseMaxHp}
                className="flex-1 rounded-xl bg-black/25 px-3 py-2 text-xs font-semibold text-panel-foreground transition active:scale-[0.98] disabled:opacity-40"
              >
                Repair base +5
                <span className="block text-[10px] text-panel-muted">30 gold</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {state.gameOver && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur">
          <h2 className="font-display text-5xl tracking-wide text-danger">Overrun</h2>
          <p className="text-sm text-panel-muted">
            You survived {state.wave} waves and dropped {state.kills} zombies.
          </p>
          <button
            onClick={() => game.reset()}
            className="rounded-xl bg-accent px-8 py-3 font-display text-xl tracking-wide text-accent-foreground"
          >
            Defend again
          </button>
        </div>
      )}
    </div>
  );
}
