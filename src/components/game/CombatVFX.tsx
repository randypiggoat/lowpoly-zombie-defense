import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { game, type TowerKind } from "@/game/engine";
import { getCombatImpactProfile } from "@/game/combatVfxDesign";

const MAX_BURSTS = 24;
const MAX_ZOMBIES = 60;
const DEFAULT_SPARK_SCALE: [number, number, number] = [1, 1, 1];

type BurstState = {
  active: boolean;
  life: number;
  duration: number;
  x: number;
  y: number;
  z: number;
  size: number;
  kind: "hit" | "kill" | "heal";
  color: string;
  attack: TowerKind | null;
};

const BOSS_COLORS: Record<number, string> = {
  2: "#ef7d43",
  3: "#f0c75e",
  4: "#ff8b45",
  5: "#70d6e3",
  6: "#d98adf",
  7: "#9ce06d",
};

function effectColor(
  kind: BurstState["kind"],
  zombieKind: number,
  boss: boolean,
  attack: TowerKind | null = null,
) {
  if (kind === "heal") return "#8ee6a0";
  if (kind === "hit" && attack) return getCombatImpactProfile(attack)?.color ?? "#fff1c7";
  if (boss) return BOSS_COLORS[zombieKind] ?? "#f0c75e";
  return kind === "kill" ? "#ffd66d" : "#fff1c7";
}

function createBurstState(): BurstState {
  return {
    active: false,
    life: 1,
    duration: 0.24,
    x: 0,
    y: 0,
    z: 0,
    size: 1,
    kind: "hit",
    color: "#fff1c7",
    attack: null,
  };
}

export function CombatVFX({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const sparks = useRef<Array<Array<THREE.Mesh | null>>>(
    Array.from({ length: MAX_BURSTS }, () => Array(4).fill(null)),
  );
  const states = useRef(Array.from({ length: MAX_BURSTS }, createBurstState));
  const cursor = useRef(0);
  const previousIds = useRef<number[]>([]);
  const previousFlash = useRef<number[]>([]);
  const previousHeal = useRef<number[]>([]);
  const previousDead = useRef<boolean[]>([]);

  function spawn(
    x: number,
    y: number,
    z: number,
    kind: BurstState["kind"],
    size: number,
    color: string,
    attack: TowerKind | null = null,
  ) {
    if (reducedMotion) return;
    const index = cursor.current;
    cursor.current = (cursor.current + 1) % MAX_BURSTS;
    const state = states.current[index]!;
    state.active = true;
    state.life = 0;
    state.duration = kind === "kill" ? 0.48 : kind === "heal" ? 0.34 : 0.22;
    state.x = x;
    state.y = y;
    state.z = z;
    state.size = size * (kind === "hit" ? (getCombatImpactProfile(attack)?.scale ?? 1) : 1);
    state.kind = kind;
    state.color = color;
    state.attack = kind === "hit" ? attack : null;

    const root = groups.current[index];
    if (root) {
      root.visible = true;
      root.position.set(x, y, z);
      root.rotation.set(0, 0, 0);
      root.scale.setScalar(0.18);
    }
  }

  useFrame((_, dt) => {
    const zombies = game.state.zombies;

    for (let i = 0; i < MAX_ZOMBIES; i++) {
      const z = zombies[i];
      const previousId = previousIds.current[i] ?? -1;
      if (!z || z.id !== previousId) {
        previousIds.current[i] = z?.id ?? -1;
        previousFlash.current[i] = z?.flash ?? 0;
        previousHeal.current[i] = z?.healFlash ?? 0;
        previousDead.current[i] = z?.dead ?? false;
        continue;
      }

      const lastFlash = previousFlash.current[i] ?? 0;
      const lastHeal = previousHeal.current[i] ?? 0;
      const lastDead = previousDead.current[i] ?? false;

      if (!z.dead && z.flash > 0.86 && lastFlash <= 0.86) {
        spawn(
          z.x,
          0.56 + z.y,
          z.z,
          "hit",
          z.boss ? 1.18 : 0.72,
          effectColor("hit", z.kind, z.boss, z.hitKind ?? null),
          z.hitKind ?? null,
        );
      }

      if (z.dead && !lastDead) {
        spawn(z.x, Math.max(0.35, 0.5 + z.y), z.z, "kill", z.boss ? 2.05 : 1.12, effectColor("kill", z.kind, z.boss));
      }

      const healFlash = z.healFlash ?? 0;
      if (!z.dead && healFlash > 0.86 && lastHeal <= 0.86) {
        spawn(z.x, 1.25 + z.y, z.z, "heal", 0.9, effectColor("heal", z.kind, false));
      }

      previousFlash.current[i] = z.flash;
      previousHeal.current[i] = healFlash;
      previousDead.current[i] = z.dead;
    }

    for (let index = 0; index < states.current.length; index++) {
      const state = states.current[index]!;
      if (!state.active) continue;
      state.life += dt;
      const root = groups.current[index];
      if (!root) continue;
      const progress = Math.min(1, state.life / state.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const impact = state.attack ? getCombatImpactProfile(state.attack) : null;
      const lift = state.kind === "kill" ? 0.18 : impact?.lift ?? 0.08;
      root.position.set(state.x, state.y + eased * lift, state.z);
      const pulse = state.kind === "kill" ? 0.55 + eased * 2.2 : 0.5 + eased * 1.65;
      root.scale.setScalar(state.size * pulse);
      root.rotation.y += dt * (state.kind === "kill" ? 7 : impact?.rotationSpeed ?? 4.5);
      root.rotation.z += dt * (state.kind === "heal" ? -2.5 : impact ? impact.rotationSpeed * 0.35 : 2.8);

      const ring = rings.current[index];
      const core = cores.current[index];
      if (ring) {
        // Hits spread across the ground plane; healing forms an upright rising pulse.
        ring.rotation.set(state.kind === "heal" ? 0 : impact?.ringTilt ?? Math.PI / 2, 0, 0);
        const ringScale = state.kind === "kill"
          ? 1.18 + (1 - progress) * 0.3
          : state.kind === "heal"
            ? 0.76 + eased * 0.42
            : 1 + (1 - progress) * 0.12;
        ring.scale.set(
          ringScale * (impact?.ringScaleX ?? 1),
          ringScale * (impact?.ringScaleY ?? 1),
          1,
        );
        (ring.material as THREE.MeshBasicMaterial).color.set(state.color);
        (ring.material as THREE.MeshBasicMaterial).opacity =
          (state.kind === "heal" ? 0.6 : 0.72) * (1 - progress * 0.85);
      }
      if (core) {
        const coreScale = state.kind === "kill"
          ? 1.25 + (1 - progress) * 0.55
          : state.kind === "heal"
            ? 0.72 + (1 - progress) * 0.4
            : 1 + (1 - progress) * 0.45;
        core.scale.setScalar(coreScale);
        core.position.y = state.kind === "heal" ? eased * 0.32 : 0;
        (core.material as THREE.MeshBasicMaterial).color.set(state.color);
      }
      const sparkRefs = sparks.current[index];
      const sparkCount = impact?.sparkCount ?? 4;
      const sparkScale = impact?.sparkScale ?? DEFAULT_SPARK_SCALE;
      for (let shard = 0; shard < 4; shard++) {
        const spark = sparkRefs?.[shard];
        if (spark) {
          const angle = shard * ((Math.PI * 2) / sparkCount) + progress * (state.kind === "kill" ? 0.7 : 0.28);
          const spread = state.kind === "kill"
            ? 0.22 + eased * 0.72
            : state.kind === "heal"
              ? 0.16 + eased * 0.24
              : (0.2 + eased * 0.34) * ((impact?.spread ?? 0.34) / 0.34);
          if (state.kind === "heal") {
            spark.position.set(Math.cos(angle) * spread, 0.08 + eased * 0.48 + Math.sin(angle) * spread * 0.4, Math.sin(angle) * spread);
          } else if (state.kind === "kill") {
            spark.position.set(Math.cos(angle) * spread, Math.sin(angle) * spread + eased * 0.2, Math.cos(angle * 0.7) * spread * 0.46);
          } else {
            const verticalSpread = impact?.verticalSpread ?? 0.13;
            spark.position.set(
              Math.cos(angle) * spread,
              verticalSpread * (0.35 + eased),
              Math.sin(angle) * spread,
            );
          }
          spark.rotation.x = angle * 0.35;
          spark.rotation.z = angle;
          spark.scale.set(sparkScale[0], sparkScale[1], sparkScale[2]);
          (spark.material as THREE.MeshBasicMaterial).color.set(state.color);
          (spark.material as THREE.MeshBasicMaterial).opacity =
            (shard < sparkCount ? 0.78 : 0) * (1 - progress);
        }
      }

      if (progress >= 1) {
        state.active = false;
        root.visible = false;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_BURSTS }, (_, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh
            name="ring"
            ref={(el) => void (rings.current[i] = el)}
            rotation-x={Math.PI / 2}
          >
            <torusGeometry args={[0.42, 0.055, 5, 14]} />
            <meshBasicMaterial color="#fff1c7" transparent opacity={0.72} />
          </mesh>
          <mesh
            name="core"
            ref={(el) => void (cores.current[i] = el)}
          >
            <icosahedronGeometry args={[0.13, 0]} />
            <meshBasicMaterial color="#fff1c7" />
          </mesh>
          {[0, 1, 2, 3].map((shard) => {
            const angle = (shard / 4) * Math.PI * 2;
            return (
              <mesh
                key={shard}
                name={"spark-" + shard}
                ref={(el) => void (sparks.current[i]![shard] = el)}
                position={[Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0]}
                rotation-z={angle}
                visible
              >
                <octahedronGeometry args={[0.085, 0]} />
                <meshBasicMaterial color="#fff1c7" transparent opacity={0.78} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
