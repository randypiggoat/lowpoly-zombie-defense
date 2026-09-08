// Pure game simulation for the idle tower defense game.
// No React, no three.js — just numbers the renderer reads each frame.

export type Vec2 = { x: number; z: number };

export const PATH: Vec2[] = [
  { x: -6, z: -22 },
  { x: -6, z: -9 },
  { x: 5, z: -9 },
  { x: 5, z: 2 },
  { x: -4, z: 2 },
  { x: -4, z: 11 },
];

export const PATH_LENGTH = (() => {
  let len = 0;
  for (let i = 1; i < PATH.length; i++) {
    len += Math.hypot(PATH[i]!.x - PATH[i - 1]!.x, PATH[i]!.z - PATH[i - 1]!.z);
  }
  return len;
})();

export function pointAt(dist: number): Vec2 {
  let d = Math.max(0, dist);
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1]!;
    const b = PATH[i]!;
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    d -= seg;
  }
  return PATH[PATH.length - 1]!;
}

export type Zombie = {
  id: number;
  dist: number;
  hp: number;
  maxHp: number;
  speed: number;
  kind: 0 | 1 | 2; // walker, runner, brute
  x: number;
  z: number;
  wobble: number;
  dead: boolean;
  fade: number;
  slow?: boolean;
};

export type TowerKind = "gunner" | "cannon" | "frost" | "tesla";

export type Tower = {
  id: number;
  kind: TowerKind;
  x: number;
  z: number;
  level: number;
  cooldown: number;
  aim: number;
};

export type Bullet = {
  id: number;
  x: number;
  z: number;
  y: number;
  tx: number;
  tz: number;
  speed: number;
  damage: number;
  target: number;
  kind: TowerKind;
  alive: boolean;
};

export const TOWER_INFO: Record<
  TowerKind,
  { name: string; blurb: string; damage: number; rate: number; range: number; cost: number; accent: string }
> = {
  gunner: { name: "Gunner", blurb: "Fast single shots", damage: 6, rate: 2.2, range: 6.5, cost: 40, accent: "#e9b44c" },
  cannon: { name: "Cannon", blurb: "Slow, heavy hits", damage: 26, rate: 0.6, range: 7.5, cost: 70, accent: "#e2725b" },
  frost: { name: "Frost", blurb: "Slows the horde", damage: 4, rate: 1.4, range: 6, cost: 60, accent: "#79c7e3" },
  tesla: { name: "Tesla", blurb: "Chains damage", damage: 12, rate: 1.1, range: 5.5, cost: 90, accent: "#b892ff" },
};

export type GameState = {
  gold: number;
  baseHp: number;
  baseMaxHp: number;
  wave: number;
  waveTimer: number;
  spawnQueue: number;
  spawnTimer: number;
  kills: number;
  income: number;
  incomeLevel: number;
  zombies: Zombie[];
  bullets: Bullet[];
  towers: Tower[];
  gameOver: boolean;
  flash: number;
};

export function towerDamage(t: Tower) {
  return TOWER_INFO[t.kind].damage * Math.pow(1.55, t.level - 1);
}
export function towerRange(t: Tower) {
  return TOWER_INFO[t.kind].range + (t.level - 1) * 0.35;
}
export function towerRate(t: Tower) {
  return TOWER_INFO[t.kind].rate * (1 + (t.level - 1) * 0.12);
}
export function upgradeCost(t: Tower) {
  return Math.round(TOWER_INFO[t.kind].cost * Math.pow(1.7, t.level - 1));
}
export function incomeCost(level: number) {
  return Math.round(50 * Math.pow(1.8, level - 1));
}
export function incomePerSecond(level: number) {
  return 2 + (level - 1) * 2.5;
}

let nextId = 1;

function makeState(): GameState {
  return {
    gold: 120,
    baseHp: 20,
    baseMaxHp: 20,
    wave: 0,
    waveTimer: 4,
    spawnQueue: 0,
    spawnTimer: 0,
    kills: 0,
    income: 0,
    incomeLevel: 1,
    zombies: [],
    bullets: [],
    towers: [
      { id: 1, kind: "gunner", x: -8.3, z: -9, level: 1, cooldown: 0, aim: 0 },
      { id: 2, kind: "cannon", x: 7.8, z: -4.5, level: 1, cooldown: 0, aim: 0 },
      { id: 3, kind: "frost", x: 1.5, z: 5.5, level: 1, cooldown: 0, aim: 0 },
      { id: 4, kind: "tesla", x: -7.8, z: 6.5, level: 1, cooldown: 0, aim: 0 },
    ],
    gameOver: false,
    flash: 0,
  };
}

export class Game {
  state: GameState = makeState();
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  reset() {
    this.state = makeState();
    this.emit();
  }

  upgrade(towerId: number) {
    const s = this.state;
    const t = s.towers.find((x) => x.id === towerId);
    if (!t) return;
    const cost = upgradeCost(t);
    if (s.gold < cost) return;
    s.gold -= cost;
    t.level += 1;
    this.emit();
  }

  upgradeIncome() {
    const s = this.state;
    const cost = incomeCost(s.incomeLevel);
    if (s.gold < cost) return;
    s.gold -= cost;
    s.incomeLevel += 1;
    this.emit();
  }

  repair() {
    const s = this.state;
    if (s.baseHp >= s.baseMaxHp) return;
    const cost = 30;
    if (s.gold < cost) return;
    s.gold -= cost;
    s.baseHp = Math.min(s.baseMaxHp, s.baseHp + 5);
    this.emit();
  }

  private spawn() {
    const s = this.state;
    const w = s.wave;
    const roll = Math.random();
    const kind: 0 | 1 | 2 = w > 3 && roll > 0.88 ? 2 : w > 1 && roll > 0.65 ? 1 : 0;
    const baseHp = 16 * Math.pow(1.22, w - 1);
    const hp = kind === 2 ? baseHp * 3.2 : kind === 1 ? baseHp * 0.7 : baseHp;
    const speed = kind === 2 ? 0.85 : kind === 1 ? 2.2 : 1.3;
    s.zombies.push({
      id: nextId++,
      dist: -Math.random() * 2,
      hp,
      maxHp: hp,
      speed,
      kind,
      x: PATH[0]!.x,
      z: PATH[0]!.z,
      wobble: Math.random() * 10,
      dead: false,
      fade: 0,
    });
  }

  tick(dtRaw: number) {
    const s = this.state;
    const dt = Math.min(dtRaw, 0.05);
    if (s.gameOver) return;

    // idle income
    s.income += incomePerSecond(s.incomeLevel) * dt;
    if (s.income >= 1) {
      const whole = Math.floor(s.income);
      s.gold += whole;
      s.income -= whole;
    }

    // waves
    if (s.spawnQueue > 0) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        this.spawn();
        s.spawnQueue -= 1;
        s.spawnTimer = Math.max(0.35, 1.1 - s.wave * 0.03);
      }
    } else {
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) {
        s.wave += 1;
        s.spawnQueue = 4 + Math.floor(s.wave * 1.6);
        s.spawnTimer = 0;
        s.waveTimer = 14 + s.wave * 0.5;
      }
    }

    // zombies
    for (const z of s.zombies) {
      if (z.dead) {
        z.fade += dt * 2.5;
        continue;
      }
      z.wobble += dt * (4 + z.speed * 2);
      z.dist += z.speed * dt * (z.slow ? 0.55 : 1);
      z.slow = false;
      const p = pointAt(z.dist);
      z.x = p.x;
      z.z = p.z;
      if (z.dist >= PATH_LENGTH) {
        z.dead = true;
        z.fade = 1;
        s.baseHp -= z.kind === 2 ? 3 : 1;
        s.flash = 1;
        if (s.baseHp <= 0) {
          s.baseHp = 0;
          s.gameOver = true;
        }
        this.emit();
      }
    }

    // towers
    for (const t of s.towers) {
      t.cooldown -= dt;
      const range = towerRange(t);
      let best: Zombie | null = null;
      let bestDist = Infinity;
      for (const z of s.zombies) {
        if (z.dead) continue;
        const d = Math.hypot(z.x - t.x, z.z - t.z);
        if (d <= range && PATH_LENGTH - z.dist < bestDist) {
          bestDist = PATH_LENGTH - z.dist;
          best = z;
        }
      }
      if (best) {
        t.aim = Math.atan2(best.x - t.x, best.z - t.z);
        if (t.cooldown <= 0) {
          t.cooldown = 1 / towerRate(t);
          s.bullets.push({
            id: nextId++,
            x: t.x,
            z: t.z,
            y: 1.6 + t.level * 0.05,
            tx: best.x,
            tz: best.z,
            speed: t.kind === "cannon" ? 14 : t.kind === "tesla" ? 30 : 20,
            damage: towerDamage(t),
            target: best.id,
            kind: t.kind,
            alive: true,
          });
        }
      }
    }

    // bullets
    for (const b of s.bullets) {
      if (!b.alive) continue;
      const target = s.zombies.find((z) => z.id === b.target && !z.dead);
      if (target) {
        b.tx = target.x;
        b.tz = target.z;
      }
      const dx = b.tx - b.x;
      const dz = b.tz - b.z;
      const d = Math.hypot(dx, dz);
      const step = b.speed * dt;
      if (d <= step || !target) {
        b.alive = false;
        if (target) {
          const hit = (z: Zombie, dmg: number) => {
            z.hp -= dmg;
            if (b.kind === "frost") z.slow = true;
            if (z.hp <= 0 && !z.dead) {
              z.dead = true;
              z.fade = 0;
              s.kills += 1;
              s.gold += 4 + Math.floor(z.maxHp / 12);
              this.emit();
            }
          };
          hit(target, b.damage);
          if (b.kind === "cannon" || b.kind === "tesla") {
            const splash = b.kind === "cannon" ? 2.2 : 3.2;
            for (const z of s.zombies) {
              if (z.dead || z.id === target.id) continue;
              if (Math.hypot(z.x - target.x, z.z - target.z) < splash) hit(z, b.damage * 0.5);
            }
          }
        }
      } else {
        b.x += (dx / d) * step;
        b.z += (dz / d) * step;
      }
    }

    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2);

    // cleanup
    if (s.zombies.length > 0) {
      s.zombies = s.zombies.filter((z) => !(z.dead && z.fade > 1.2));
    }
    if (s.bullets.length > 0) {
      s.bullets = s.bullets.filter((b) => b.alive);
    }
  }
}

export const game = new Game();
