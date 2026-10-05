import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { game } from "@/game/engine";

const MAX_BURSTS = 24;
const MAX_ZOMBIES = 60;

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
};

const BOSS_COLORS: Record<number, string> = {
  2: "#ef7d43",
  3: "#f0c75e",
  4: "#ff8b45",
  5: "#70d6e3",
  6: "#d98adf",
  7: "#9ce06d",
};

function effectColor(kind: BurstState["kind"], zombieKind: number, boss: boolean) {
  if (kind === "heal") return "#8ee6a0";
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

  function spawn(x: number, y: number, z: number, kind: BurstState["kind"], size: number, color: string) {
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
    state.size = size;
    state.kind = kind;
    state.color = color;

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
        spawn(z.x, 0.56 + z.y, z.z, "hit", z.boss ? 1.18 : 0.72, effectColor("hit", z.kind, z.boss));
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
      root.position.set(state.x, state.y + eased * (state.kind === "kill" ? 0.18 : 0.08), state.z);
      const pulse = state.kind === "kill" ? 0.55 + eased * 2.2 : 0.5 + eased * 1.65;
      root.scale.setScalar(state.size * pulse);
      root.rotation.y += dt * (state.kind === "kill" ? 7 : 4.5);
      root.rotation.z += dt * (state.kind === "heal" ? -2.5 : 2.8);

      const ring = rings.current[index];
      const core = cores.current[index];
      if (ring) {
        ring.scale.setScalar(1 + (1 - progress) * 0.12);
        (ring.material as THREE.MeshBasicMaterial).color.set(state.color);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.72 * (1 - progress * 0.85);
      }
      if (core) {
        core.scale.setScalar(1 + (1 - progress) * 0.45);
        (core.material as THREE.MeshBasicMaterial).color.set(state.color);
      }
      const sparkRefs = sparks.current[index];
      for (let shard = 0; shard < 4; shard++) {
        const spark = sparkRefs?.[shard];
        if (spark) {
          (spark.material as THREE.MeshBasicMaterial).color.set(state.color);
          (spark.material as THREE.MeshBasicMaterial).opacity = 0.78 * (1 - progress);
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
